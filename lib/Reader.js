const BaseBridge = require('homie-sdk/lib/Bridge');

const constants = require('../etc/constants.config');
const ModbusTransport = require('./transports/modbus');
const HomieReaderClient   = require('./clients/homie');
const ModbusReaderClient  = require('./clients/modbus');
const RestApiReaderClient = require('./clients/rest');

const Storage = require('./storage');

const { Logger }     = require('./utils/Logger');
const { parseRules } = require('./../utils/parser');

class Reader extends BaseBridge {
    constructor({ id, name, slaveId, transports, workspace, token, api, homie }) {
        super({});

        this.id = id;
        this.name = name;
        this.slaveId = slaveId;
        this.workspace = workspace;
        this.token = token;
        this.api = api;
        this.homie = homie;

        this.clients = {
            modbus : null,
            homie  : null,
            rest   : null
        };

        this.state = new Storage();

        /** Bridge transports
         * mqtt
         * modbus
         */
        this.transports = transports;

        this.log = Logger(`[${slaveId}]Reader`);

        this.intervals = {
            rules      : undefined,
            updateTime : undefined,
            logs       : undefined
        };

        this.syncTime  = this.syncTime.bind(this);
        this.syncRules = this.syncRules.bind(this);
        this.syncLogs  = this.syncLogs.bind(this);

        this.restartReader = this.restartReader.bind(this);

        this.isSyncingTime = false;
        this.isSyncingRules = false;
        this.isSyncingLogs = false;
    }

    async init(timeout = 0) {
        this.clients = {
            modbus : new ModbusReaderClient({
                slaveId   : this.slaveId,
                transport : this.transports.modbus,
                bridge    : this
            }),
            homie : new HomieReaderClient({
                id   : this.id,
                name : this.name
            }),
            rest : new RestApiReaderClient({
                token     : this.token,
                code      : this.id,
                apiClient : this.api
            })
        };

        // init modbus
        await this.modbusClient.init(timeout);
        this.modbusClient.on('closed_connection', this.restartReader);

        // init homie
        await this.homieClient.init();

        this.attachHomie(this.homie);

        this.setDeviceBridge(this.homieClient.homieDevice);

        await super.init({ setWill: false });

        await this.syncTime();
        await this.syncRules();

        // HARDCODE
        await new Promise(res => setTimeout(res, 1000));

        await this.syncLogs();

        this._initSyncIntervals();
    }

    _clearInterval() {
        if (this.intervals.rules) clearInterval(this.intervals.rules);
        if (this.intervals.updateTime) clearInterval(this.intervals.updateTime);
        if (this.intervals.logs) clearInterval(this.intervals.logs);
    }

    _initSyncIntervals() {
        this._clearInterval();

        this.intervals = {
            updateTime : setInterval(this.syncTime, constants.UPDATE_TIME_INTERVAL),
            rules      : setInterval(this.syncRules, constants.UPDATE_SYNC_INTERVAL),
            logs       : setInterval(this.syncLogs, constants.UPDATE_LOGS_INTERVAL)
        };
    }

    _log(level, ...args) {
        if (this.homieClient.homieDevice.connected) this.log[level](...args);
    }

    async syncTime() {
        try {
            this.log.verbose('syncTime');
            this.log.verbose({ syncing: this.isSyncingTime });

            if (this.isSyncingTime) return;
            this.isSyncingTime = true;

            const timezone = await this.restClient.getTime();

            await this.modbusClient.syncTime(timezone);
            this.log.verbose(`Update timezone on controller: New timezone -> ${timezone}`);

            this.isSyncingTime = false;
        } catch (e) {
            this._log('warn', 'Error syncTime:');
            this._log('warn', e);
            this.isSyncingTime = false;
        }
    }

    async syncRules() {
        try {
            this.log.verbose('syncRules');
            this.log.verbose({ syncing: this.isSyncingRules });

            if (this.isSyncingRules) return;
            this.isSyncingRules = true;

            const lastSync = this.state.get('statuses.syncTimestamp');
            const rules = await this.restClient.syncRules(lastSync);
            const { syncTimestamp } = parseRules(rules);

            this.log.verbose(`Update rules on controller: LastSync -> ${lastSync}, Rules -> ${rules}`);
            await this.modbusClient.syncRules(rules);
            this.state.set('statuses.syncTimestamp', syncTimestamp);

            this.isSyncingRules = false;
        } catch (e) {
            this._log('warn', 'Error syncRules:');
            this._log('warn', e);
            this.isSyncingRules = false;
        }
    }

    async syncLogs() {
        try {
            this.log.verbose('syncLogs');
            this.log.verbose({ syncing: this.isSyncingLogs });

            if (this.isSyncingLogs) return;
            this.isSyncingLogs = true;

            const haveLogs = this.state.get('statuses.haveLogs');

            if (!haveLogs) {
                this.log.verbose(`Logs -> ${haveLogs}. Skip!`);

                this.isSyncingLogs = false;

                return;
            }

            const logs = await this.modbusClient.getLogs();

            this.log.verbose(`Getting logs from controller: Logs -> ${logs}`);

            const res = await this.restClient.postLogs(logs);

            this.log.verbose('Writing to server:');
            this.log.verbose(res);

            // HARDCODE!!!
            if (res.split(',')[0] === 'ok') {
                // clear received logs from controller
                await this.modbusClient.clearLogs();
            }

            this.isSyncingLogs = false;
        } catch (e) {
            this._log('warn', 'Error syncLogs:');
            this._log('warn', e);
            this.isSyncingLogs = false;
        }
    }

    async restartReader() {
        await this.closedModbusConnection();
        await this._restartInit();
    }

    async closedModbusConnection() {
        try {
            // emqx status - disconected
            this.homieClient.disconnect();

            // off listener of closed_connection
            this.modbusClient.off('closed_connection', this.restartReader);

            // clear api interval requests - not worked?
            this._clearInterval();

            // clear queue of modbus requests
            await this.transports.modbus.clearQueue(this.slaveId);

            this.log.error('closing connection...');
        } catch (e) {
            this.log.warn(`reader [${this.slaveId}]: Can't close Modbus Connection`);
            this.log.warn(e);
        }
    }

    async setModbusTransport(transport) {
        this.log.warn('reset modbus transport');
        if (!(transport instanceof ModbusTransport)) {
            throw new Error('Settable value is not instance of ModbusTransport');
        }

        this.transports.modbus = transport;
        this.modbusClient.setTransport(transport);
    }

    async _restartInit() {
        try {
            // start init reader
            await this.modbusClient.init(constants.MODBUS_REQUEST_TIMEOUT);
            this.modbusClient.on('closed_connection', this.restartReader);

            // status - ready
            this.homieClient.connect();

            // start api interval requests
            this._initSyncIntervals();
        } catch (e) {
            this.log.warn(`_restartInit reader [${this.slaveId}] error: ${e}`);
            await new Promise((resolve) => setTimeout(resolve, constants.MODBUS_RETRY_INIT_INTVL));
            await this._restartInit();
        }
    }

    get isReaderOnline() {
        return this.homieClient.homieDevice.connected;
    }

    get modbusClient() {
        return this.clients.modbus;
    }

    get homieClient() {
        return this.clients.homie;
    }

    get restClient() {
        return this.clients.rest;
    }
}

module.exports = Reader;
