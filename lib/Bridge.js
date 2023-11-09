const EventEmitter = require('events');

const Homie           = require('homie-sdk/lib/homie/Homie');
const { getUserHash } = require('homie-sdk/lib/utils');

const diff = require('lodash/difference');

const {
    BRIDGE_TYPE,
    MODBUS_RETRY_INIT_INTVL,
    REST_API_RETRY_INTERVAL,
    MODBUS_REQUEST_TIMEOUT
} = require('./../etc/constants.config');

const Reader     = require('./Reader');
const ApiClient  = require('./api');

const {
    url    : apiUrl,
    routes : { api }
} = require('./../etc/rest-api.config');

const {
    mqtt   : mqttConfig,
    modbus : modbusConfig,
    workspace
} = require('./../etc/bridge.config');


const { Logger }        = require('./utils/Logger');
const {
    createReqBody,
    getReaderName,
    getReaderCode
} = require('./utils/bridge');

const MqttTransport   = require('./transports/mqtt');
const ModbusTransport = require('./transports/modbus');

class Bridge extends EventEmitter {
    constructor({ id, slaveIds, token, serviceToken }) {
        super();

        this.id = id;
        this.slaveIds = slaveIds;
        this.token = token;
        this.serviceToken = serviceToken;

        this.api = null;
        this.readers = {};

        this.initializing = false;
        this.initialized  = false;

        this.transports = {
            mqtt   : undefined,
            modbus : undefined
        };

        this.payload = {
            type    : BRIDGE_TYPE,
            token   : this.serviceToken,
            payload : {
                workspace : workspace.name
            }
        };

        this.handleModbusOutgoingRawdata = this.handleModbusOutgoingRawdata.bind(this);
        this.handleModbusIncomingRawdata = this.handleModbusIncomingRawdata.bind(this);
        this.handleModbusClose = this.handleModbusClose.bind(this);
        this.handleModbusError = this.handleModbusError.bind(this);
        this.handleModbusConnect = this.handleModbusConnect.bind(this);
        this.reconnect = false;

        this.log = Logger('Bridge');
    }

    async init() {
        try {
            this.initializing = true;
            this.log.info(`Init: ${this.slaveIds}`);

            await this._initModbusTransport();
            await this._initMqttTransport();

            this.api = new ApiClient({ apiUrl });

            this.accessToken = await this._createSession(api.CREATE_JWT_TOKEN, this.payload);

            await this._requestReadersCreation(this.accessToken);

            await this._initReaders();

            this.initializing = false;
            this.initialized = true;
        } catch (e) {
            this.log.error(e);

            this.emit('error', e);
        }
    }

    async _initMqttTransport() {
        this.log.info('_initMqttTransport start');
        this.log.verbose('_initMqttTransport config:');
        this.log.verbose(mqttConfig);

        const transport = new MqttTransport(mqttConfig);

        await transport.connect();

        this.transports.mqtt = transport;
    }

    async _initModbusTransport() {
        this.log.info('_initModbusTransport start');
        this.log.verbose('_initModbusTransport config:');
        this.log.verbose(modbusConfig);

        const transport = new ModbusTransport(modbusConfig);

        this.transports.modbus = transport;

        transport.on('outgoing-rawdata', this.handleModbusOutgoingRawdata);
        transport.on('incomming-rawdata', this.handleModbusIncomingRawdata);
        transport.on('close', this.handleModbusClose);
        transport.on('error', this.handleModbusError);
        transport.on('connect', this.handleModbusConnect);

        await transport.connect();
    }

    async _createSession(url, payload) {
        try {
            const res = await this.api.post(url, payload);

            return res.data.jwt;
        } catch (e) {
            this.log.verbose('_createSession error:', e);
            return await new Promise(resolve => setTimeout(async () => {
                const res = await this._createSession(url, payload);

                resolve(res);
            }, REST_API_RETRY_INTERVAL));
        }
    }

    async _requestReadersCreation(token) {
        try {
            const body = createReqBody(this.id, this.slaveIds);

            this.log.verbose('_requestReadersCreation body:');
            this.log.verbose(body);

            const res = await this.api.post(api.READER_BULK_CREATE, body, { 'X-AuthToken': token });

            this.log.verbose('_requestReadersCreation res:');
            this.log.verbose(res);
        } catch (e) {
            this.log.error('_requestReadersCreation error:', e);
            return await new Promise(resolve => setTimeout(async () => {
                const res = await this._requestReadersCreation(token);

                resolve(res);
            }, REST_API_RETRY_INTERVAL));
        }
    }

    async _initReaders(timeout = 0) {
        for (const slaveId of this.slaveIds) {
            await this._initReader(slaveId, timeout);
        }

        // cast to int
        const initialized = Object.keys(this.readers).map(id => +id);
        const notInitialized = diff(this.slaveIds, initialized);

        this.log.verbose('Not initialized readers:');
        this.log.verbose({ notInitialized });

        if (notInitialized.length) setTimeout(() => this._initReaders(MODBUS_REQUEST_TIMEOUT), MODBUS_RETRY_INIT_INTVL);
    }

    async _initReader(slaveId, timeout) {
        try {
            if (this.readers[slaveId]) return;

            const reader = new Reader({
                id         : getReaderCode(this.id, slaveId),
                name       : getReaderName(this.id, slaveId),
                slaveId,
                transports : this.transports,
                workspace  : workspace.login,
                token      : this.token,
                api        : this.api,
                homie      : new Homie({ transport: this.transports.mqtt, rootTopic: getUserHash(workspace.login) })
            });

            await reader.init(timeout);

            this.readers[slaveId] = reader;
        } catch (e) {
            this.log.warn(`_initReader[${slaveId}]: ${e}`);
        }
    }

    handleModbusOutgoingRawdata(buffer) {
        this.log.verbose('outgoing-rawdata');
        this.log.verbose(buffer);
    }

    handleModbusIncomingRawdata(buffer) {
        this.log.verbose('incomming-rawdata');
        this.log.verbose(buffer);
    }

    handleModbusError(error) {
        this.log.error('Modbus transport error:');
        this.log.error(error);
    }

    async handleModbusConnect() {
        this.log.info('_initModbusTransport restart');

        if (!this.reconnect) {
            this.reconnect = true;
            return;
        }

        await this._updateNewModbusTransport();
    }

    async handleModbusClose() {
        this.log.error('Modbus transport close.');
        await this._destroyModbusTransport();
    }

    async _destroyModbusTransport() {
        await this.transports.modbus.close();
    }

    async _updateNewModbusTransport() {
        // eslint-disable-next-line guard-for-in
        for (const index in this.readers) {
            await this.readers[index].setModbusTransport(this.transports.modbus);
        }
    }
}

module.exports = Bridge;
