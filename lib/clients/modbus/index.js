const EventEmitter = require('events');

const ModbusTransport = require('../../transports/modbus');
const CONSTANTS  = require('./../../../etc/constants.config');
const instance   = require('./../../../etc/mqtt.config');
const { Logger } = require('./../../utils/Logger');

const ADDRESS = Object.freeze({
    TOKEN          : 0x11,
    DOOR_STATE     : 0x20,
    OPEN_DOOR_TIME : 0x21,
    BUZZER         : 0X22,
    LOCK_TYPE      : 0x23,
    RFID_TYPE      : 0x24,
    TRIGGER_MODE   : 0x25,
    PERMISSION     : 0x26,
    K1             : 0x27,
    K2             : 0x28,
    K1T            : 0x29,
    K2T            : 0x2A,
    EXIT_BTN       : 0x2B
});

class ModbusReader extends EventEmitter {
    constructor({ slaveId, transport, bridge }) {
        super();

        this.slaveId   = slaveId;
        this.transport = transport;
        this.bridge    = bridge;

        this.log = Logger(`[${this.slaveId}]ModbusClient`);

        this.intervals = {
            statuses : undefined
        };

        this._syncStatusesInterval = this._syncStatusesInterval.bind(this);
        this._syncOptionsInterval  = this._syncOptionsInterval.bind(this);
    }

    // sync values from real device
    async init(timeout = 0) {
        const extra = {
            priority   : CONSTANTS.MODBUS_REQUEST_LOW_PRIORITY,
            unitId     : this.slaveId,
            retryCount : 0,
            timeout
        };

        this.retryRequest = {
            retryCount : CONSTANTS.MODBUS_RETRY_REQUEST_COUNT,
            priority   : CONSTANTS.MODBUS_REQUEST_LOW_PRIORITY,
            unitId     : this.slaveId
        };

        await this.getStatuses(extra);
        await this.getOptions(extra);

        this._initSyncIntervals();
    }

    _clearIntervals() {
        if (this.intervals.statuses) clearInterval(this.intervals.statuses);
        if (this.intervals.options) clearInterval(this.intervals.options);
    }

    _initSyncIntervals() {
        this._clearIntervals();

        this.intervals = {
            statuses : setInterval(this._syncStatusesInterval, CONSTANTS.SYNC_STATUSES_INTERVAL),
            options  : setInterval(this._syncOptionsInterval, CONSTANTS.SYNC_OPTIONS_INTERVAL)
        };
    }

    async getStatuses(requestObj) {
        this.log.verbose('getStatuses');
        const { data } = await this._request('ReadHoldingRegisters', requestObj, 0, 5);

        const [ isSynchronizing, isTimeSynchronized, haveLogs ] = data.slice(0, 3).map(buffer => !!buffer.readUInt16BE(0));
        const hiLowTimeBuff = data.slice(3, 5).reverse();
        const syncTimestamp = Buffer.concat(hiLowTimeBuff).readUInt32BE(0);

        const statuses = { isSynchronizing, isTimeSynchronized, haveLogs, syncTimestamp };

        this.log.verbose({ statuses });
        this.bridge.state.set('statuses', statuses);

        return statuses;
    }

    /**
     * RO - read only
     * RW - read/write
     *
     * Registers:
     * (RW) 0x20 - Door state.              Values: 0 - closed, 1 - open
     * (RW) 0x21 - Open door time.          Values: Time in seconds
     * (RW) 0x22 - Buzzer.                  Values: 0 - off, 1 - on
     * (RW) 0x23 - Lock type.               Values: 0 - latch, 1 - magnet
     * (RW) 0x24 - rfid type.               Values: 0 - wiegand, 1 - 1ware
     * (RW) 0x25 - Trigger mode.            Values: 0 - off, 1 - on
     * (RW) 0x26 - Permission in emergency. Values: 0 - off, 1 - on
     * (RO) 0x27 - K1.                      Values: 0 - off, 1 - on
     * (RO) 0x28 - K2.                      Values: 0 - off, 1 - on
     * (RW) 0x29 - K1 type.                 Values: 0 - off, 1 - on
     * (RW) 0x2A - K2 type.                 Values: 0 - off, 1 - on
     * (RW) 0x2B - Exit button.             Values: 0 - off, 1 - on
     */
    async getOptions(requestObj) {
        this.log.verbose('getOptions');
        const { data } = await this._request('ReadHoldingRegisters', requestObj, 0x20, 12);

        const doorOpened = !!data[0].readUInt16BE(0);
        const openDoorTime = data[1].readUInt16BE(0);
        const buzzer = !!data[2].readUInt16BE(0);
        const lockType = CONSTANTS.LOCK_TYPE[data[3].readUInt16BE(0)];
        const rfidType = CONSTANTS.READER_TYPE[data[4].readUInt16BE(0)];
        const triggerMode = !!data[5].readUInt16BE(0);
        const permissionInEmergency = !!data[6].readUInt16BE(0);
        const k1State = !!data[7].readUInt16BE(0); // K1
        const k2State = !!data[8].readUInt16BE(0); // K2
        const k1Type = CONSTANTS.K_TYPE[data[9].readUInt16BE(0)];
        const k2Type = CONSTANTS.K_TYPE[data[10].readUInt16BE(0)];
        const exitBtn = !!data[11].readUInt16BE(0);

        const options = {
            [instance.doorOpened]            : doorOpened,
            [instance.openDoorTime]          : openDoorTime,
            [instance.buzzer]                : buzzer,
            [instance.lockType]              : lockType,
            [instance.rfidType]              : rfidType,
            [instance.triggerMode]           : triggerMode,
            [instance.permissionInEmergency] : permissionInEmergency,
            [instance.k1]                    : k1State,
            [instance.k2]                    : k2State,
            [instance.k1Type]                : k1Type,
            [instance.k2Type]                : k2Type,
            [instance.exitBtn]               : exitBtn
        };

        this.log.verbose({ options });
        this.bridge.state.set('options', options);

        return options;
    }

    async setBuzzer(cmd, stateKey) {
        return this._setBoolRegister(cmd, stateKey, ADDRESS.BUZZER);
    }

    async setKType(cmd, stateKey, id) {
        return this._setEnumRegister(cmd, stateKey, ADDRESS[id.toUpperCase()], CONSTANTS.ENUM_TYPES.K_TYPE);
    }

    async setLockType(cmd, stateKey) {
        return this._setEnumRegister(cmd, stateKey, ADDRESS.LOCK_TYPE, CONSTANTS.ENUM_TYPES.LOCK_TYPE);
    }

    async setOpenDoorTime(cmd, stateKey) {
        return this._setIntRegister(cmd, stateKey, ADDRESS.OPEN_DOOR_TIME);
    }

    async setPermissionInEmergency(cmd, stateKey) {
        return this._setBoolRegister(cmd, stateKey, ADDRESS.PERMISSION);
    }

    async setReaderType(cmd, stateKey) {
        return this._setEnumRegister(cmd, stateKey, ADDRESS.RFID_TYPE, CONSTANTS.ENUM_TYPES.READER_TYPE);
    }

    async setTriggerMode(cmd, stateKey) {
        return this._setBoolRegister(cmd, stateKey, ADDRESS.TRIGGER_MODE);
    }

    async setExitBtn(cmd, stateKey) {
        return this._setBoolRegister(cmd, stateKey, ADDRESS.EXIT_BTN);
    }

    async openDoor(cmd, stateKey) {
        return this._setBoolRegister(cmd, stateKey, ADDRESS.DOOR_STATE, CONSTANTS.MODBUS_REQUEST_URGENT_PRIORITY);
    }

    async isDoorOpened() {
        const extra = { ...this.retryRequest, priority: CONSTANTS.MODBUS_REQUEST_URGENT_PRIORITY };
        const { data } = await this._request('ReadHoldingRegisters', extra, 0x20, 1);

        const val = !!data[0].readUInt16BE(0);

        this.log.verbose(`isDoorOpened: ${val}`);

        this.bridge.state.set(`options.${instance.doorOpened}`, val);

        return val;
    }

    async setToken(cmd) {
        const extra = { ...this.retryRequest, priority: CONSTANTS.MODBUS_REQUEST_URGENT_PRIORITY };

        const { data } = await this._request('OpenByToken', extra, 0x11, cmd);
        const doorState = !!data;

        this.bridge.state.set(`options.${instance.doorOpened}`, doorState);
        return doorState;
    }

    async syncTime(timezone) {
        await this._request('SyncTime', this.retryRequest, 1, 1, Buffer.from(timezone, 'utf-8'));

        this.bridge.state.set('timezone', timezone);
    }

    async cutBuffer(str, maxBytes = CONSTANTS.SYNC_RULES_MAX_BYTES) {
        const rules = await str.split('\n').map(el => `${el}\n`);
        const result = [];

        let len = 0;

        let pack = '';

        for (const rule of rules) {
            const lengthOfRule = Buffer.from(rule, 'utf8').length;

            if (lengthOfRule + len > maxBytes) {
                result.push(pack);
                len = 0;
                pack = '';
            }

            len += lengthOfRule;
            pack += rule;
        }

        result.push(pack);
        return result;
    }

    async isReaderBusy(length) {
        const sec = Math.round(length / 1000) || 1;
        const { data } = await this._request('ReadHoldingRegisters', this.retryRequest, 0, 1);
        const state = !!data[0].readUInt16BE(0);

        if (state) {
            await new Promise(res => setTimeout(res, sec * 1000));
            await this.isReaderBusy(length);
        }
    }

    async syncRules(rules) {
        const packages =  await this.cutBuffer(rules);

        let packageLength = 0;

        let index = 1;

        for (const pack of packages) {
            await this.isReaderBusy(packageLength);
            packageLength = packages.length;

            await this._request('SyncRules', this.retryRequest, index, packageLength, Buffer.from(pack, 'utf8'));
            index++;
        }
    }

    async getLogs() {
        const { data } = await this._request('GetLogs', {
            ...this.retryRequest,
            timeout : CONSTANTS.MODBUS_TRANSPORT_GET_LOGS_TIMEOUT_MS
        });

        return data;
    }

    async clearLogs() {
        const res = await this._request('WriteSingleRegister', this.retryRequest, 0x10, Buffer.from([ 0, 1 ]));

        return res;
    }

    async isTimeSynced() {}

    async _setBoolRegister(cmd, stateKey, address, priority = CONSTANTS.MODBUS_REQUEST_LOW_PRIORITY) {
        const extra = { ...this.retryRequest, priority };
        const { value } = await this._request('WriteSingleRegister', extra, address, cmd);
        const boolValue = !!value.readUInt16BE(0);

        this.bridge.state.set(stateKey, boolValue);

        return boolValue;
    }

    async _setEnumRegister(cmd, stateKey, address, enumType) {
        const { value } = await this._request('WriteSingleRegister', this.retryRequest, address, cmd);
        const enumKey = parseInt(value.readUInt16BE(0), 10);

        this.bridge.state.set(stateKey, CONSTANTS[enumType][enumKey]);

        return CONSTANTS[enumType][enumKey];
    }

    async _setIntRegister(cmd, stateKey, address) {
        const { value } = await this._request('WriteSingleRegister', this.retryRequest, address, cmd);
        const res = value.readUInt16BE(0);

        this.bridge.state.set(stateKey, res);
        return res;
    }

    async _request(fname, extra, ...payload) {
        try {
            const res = await this.transport.request(fname, extra, ...payload);

            return res;
        } catch (e) {
            let retryCount = extra.retryCount;

            if (retryCount > 0) {
                this._log('warn', e);
                this._log('warn', `retrying ${fname} request...`);
                retryCount--;

                return await new Promise((resolve, reject) => setTimeout(async () => {
                    try {
                        const res = await this._request(fname, { ...extra, retryCount }, ...payload);

                        resolve(res);
                    } catch (err) {
                        reject(err);
                    }
                }, CONSTANTS.MODBUS_RETRY_REQUEST_INTERVAL));
            }

            this._clearIntervals();
            this.emit('closed_connection');
            throw e;
        }
    }

    _log(level, ...args) {
        if (this.bridge.homieClient.homieDevice.connected) this.log[level](...args);
    }

    setTransport(transport) {
        if (!(transport instanceof ModbusTransport)) {
            throw new Error('Settble value is not instance of ModbusTransport');
        }

        this.transport = transport;
    }

    async _syncStatusesInterval() {
        try {
            await this.getStatuses(this.retryRequest);
        } catch (e) {
            this._log('warn', 'getStatuses error:');
            this._log('warn', e);
        }
    }

    async _syncOptionsInterval() {
        try {
            await this.getOptions(this.retryRequest);
        } catch (e) {
            this._log('warn', 'getOptions error:');
            this._log('warn', e);
        }
    }
}

module.exports = ModbusReader;
