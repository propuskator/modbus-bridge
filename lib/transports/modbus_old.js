/* eslint-disable */
const EventEmitter = require('events');
const Promise      = require('bluebird');

const {
    MODBUS_OFFLINE_UNITS_DELAY,
    MODBUS_ONLINE_UNITS_DELAY,
    MODBUS_RESET_CONN_INTVL,
    MODBUS_RETRY_CONN_INTVL,
    MODBUS_CONN_TIMEOUT,
    MODBUS_CALL_RETRIES,
    MODBUS_MAX_PARALLEL_CALLS
} = require('../../etc/constants.config');
const Drivers = require('../modules/modbus/drivers');
const Transports = require('../modules/modbus/transports');

class Modbus extends EventEmitter {
    constructor(config) {
        super();

        this.config = {
            reconnect               : true,
            resetConnectionInterval : MODBUS_RESET_CONN_INTVL,
            retryConnectionInterval : MODBUS_RETRY_CONN_INTVL,
            connectionTimeout       : MODBUS_CONN_TIMEOUT,
            retriesAmount           : MODBUS_CALL_RETRIES,
            ...config,
            maxParallelCalls        : MODBUS_MAX_PARALLEL_CALLS
        };
        this.connected = false;
        this.connecting = false;
        this.retryConnectionTimeout = null;
        this.resetConnectionTimeout = null;

        //
        this.callGap = Math.max(config.callGap || 0, MODBUS_ONLINE_UNITS_DELAY); // ms between calls
        this.offlineSendGap = Math.max(config.offlineSendGap || MODBUS_OFFLINE_UNITS_DELAY, MODBUS_ONLINE_UNITS_DELAY); // ms between calls
        this.lastTimeRun = new Date(0);
        this.lastTimeRunOfflineUnit = new Date(0);
        this.onlineUnits = {};
        this.offlineUnits = {};
        this.totalUniqUnitIds = 0;
        //
        this.calls = [];

        this.handleTransportError = this.handleTransportError.bind(this);
        this.handleTransportClose = this.handleTransportClose.bind(this);
        this.handleTransportRequest = this.handleTransportRequest.bind(this);
        this.handleTransportResponse = this.handleTransportResponse.bind(this);
        this.handleTransportOugoingRawData = this.handleTransportOugoingRawData.bind(this);
        this.handleTransportIncommingRawData = this.handleTransportIncommingRawData.bind(this);

        this.dispatchNextCall = this.dispatchNextCall.bind(this);
    }

    async request(fname, extra, ...args) {
        return this._call('request', fname, extra, ...args);
    }

    async response(fname, extra, ...args) {
        return this._call('response', fname, extra, ...args);
    }

    async _call(name, fname, extra, ...args) {
        const call = {
            called  : false,
            unitId  : extra.unitId,
            retries : this.config.retriesAmount,
            deleted : false
        };

        let timeout = setTimeout(() => call.reject(new Error('Timeout')), this.config.connectionTimeout);

        const run = async () => {
            clearTimeout(timeout);
            if (!this.connected) {
                call.reject(Error('Modbus connection is not established.'));
                return;
            }

            try {
                const result = await this.transport[name](fname, extra, ...args);

                if (call.deleted) {
                    call.reject(new Error('Deleted.'));
                    return;
                }

                this.handleUnitOnline(call.unitId);
                call.resolve(result);
            } catch (error) {
                if (error.message==='GatewayTargetDeviceFailedToRespond' && call.retries > 0) {
                    // eslint-disable-next-line require-atomic-updates
                    timeout = setTimeout(() => call.reject(new Error('Timeout')), this.config.connectionTimeout);
                    call.retries--;
                    call.called = false;
                    this.dispatchNextCall();
                } else {
                    this.dispatchNextCall(call.unitId);
                    call.reject(error);
                }
            }
        };


        call.run = run;

        const promise = new Promise((resolve, reject) => {
            call.resolve = resolve;
            call.reject = reject;
        });

        this.calls.push(call);
        this.dispatchNextCall();

        return promise.finally(() => {
            this.calls = this.calls.filter(_ => _ !== call);
            this.dispatchNextCall();
        });
    }

    isConnected() {
        // return Object.keys(this.onlineUnits).length > 0;
        return Object.keys(this.onlineUnits).length > 0
            && (Object.keys(this.onlineUnits).length + Object.keys(this.offlineUnits).length >= this.totalUniqUnitIds);
    }

    onDeleteUnit(unitId) {
        this.totalUniqUnitIds--;
        this.calls.forEach((call) => {
            if (call.unitId !== unitId) return;
            if (call.called) call.deleted = true;
            else call.deffeted.reject(new Error('Deleted.'));
        });
        this.handleUnitOffline(unitId);
    }

    handleUnitOffline(unitId) {
        const before = this.isConnected();

        delete this.onlineUnits[unitId];
        this.offlineUnits[unitId] = true;
        const after = this.isConnected();


        if (before && !after) {
            if (this.connected) {
                this.destroy();
                this.emit('timeout');
                if (this.config.reconnect) this.retryConnectionTimeout = setTimeout(this.connect.bind(this), this.config.retryConnectionInterval);
            }
        } else if (!before && after) {
            this.emit('connect:valid');
        }
    }

    handleUnitOnline(unitId) {
        const before = this.isConnected();

        this.onlineUnits[unitId] = true;
        delete this.offlineUnits[unitId];
        const after = this.isConnected();

        if (!before) {
            this.refreshResetConnectionTimeout();
        }

        if (!before && after) {
            this.emit('connect:valid');
        }
    }

    dispatchNextCall() {
        // eslint-disable-next-line no-magic-numbers
        if (this.calls.filter((_call) => _call.called).length >= 10) return;
        const connected = this.isConnected();
        const calls = this.calls.filter((_call) => {
            return !_call.called
                && this.calls.filter((__call) => __call.unitId === _call.unitId && __call.called).length < this.config.maxParallelCalls;
        });

        if (!calls.length) return;

        // const offlineDelay = this.offlineSendGap - (new Date() - this.lastTimeRunOfflineUnit); // comment for lint

        const call = calls.find((_call) => {
            return (!connected || offlineDelay <= 0 || !this.offlineUnits[_call.unitId]);
        });

        if (!call) {
            setTimeout(this.dispatchNextCall.bind(this), offlineDelay);
            return;
        }


        if (call) {
            // const delay = this.callGap - (new Date() - this.lastTimeRun); // comment for lint

            if (delay>0) {
                setTimeout(this.dispatchNextCall.bind(this), delay);
            } else {
                this.lastTimeRun = new Date();
                if (this.offlineUnits[call.unitId]) this.lastTimeRunOfflineUnit = this.lastTimeRun;
                call.called = true;
                process.nextTick(call.run);
            }
        }
    }

    async connect() {
        if (this.connected) throw new Error('already connected');
        if (this.connecting) throw new Error('already connecting');

        clearTimeout(this.retryConnectionTimeout);

        this.connecting = true;

        const driverConf = this.config.driver;
        const transportConf = this.config.transport;

        const Driver = Drivers[driverConf.type];
        const Transport = Transports[transportConf.type];

        try {
            this.transport = new Transport({
                ...transportConf.options,
                connection : await Driver.connect(driverConf.connection[driverConf.type])
            });

            this.transport.on('close', this.handleTransportClose);
            this.transport.on('error', this.handleTransportError);
            this.transport.on('request', this.handleTransportRequest);
            this.transport.on('response', this.handleTransportResponse);
            this.transport.on('outgoing-rawdata', this.handleTransportOugoingRawData);
            this.transport.on('incomming-rawdata', this.handleTransportIncommingRawData);

            this.connected = true;

            this.emit('connect');
            this.refreshResetConnectionTimeout();
        } catch (error) {
            this.emit('error', error);
            if (this.config.reconnect) this.retryConnectionTimeout = setTimeout(this.connect.bind(this), this.config.retryConnectionInterval);
        } finally {
            this.connecting = false;
        }
    }

    async reconnect() {
        await this.close();
        await this.connect();
    }

    async close() {
        this.destroy();
    }

    refreshResetConnectionTimeout() {
        console.log('refreshResetConnectionTimeout', this.config.resetConnectionInterval);

        clearTimeout(this.resetConnectionTimeout);

        this.resetConnectionTimeout = setTimeout(async () => {
            await this.close();
            if (this.config.reconnect) await this.connect();
        }, this.config.resetConnectionInterval);
    }

    destroy() {
        if (!this.connected) return;

        clearTimeout(this.retryConnectionTimeout);
        clearTimeout(this.resetConnectionTimeout);

        this.transport.destroy();
        this.transport.off('close', this.handleTransportClose);
        this.transport.off('error', this.handleTransportError);
        this.transport.off('request', this.handleTransportRequest);
        this.transport.off('response', this.handleTransportResponse);
        this.transport.off('outgoing-rawdata', this.handleTransportOugoingRawData);
        this.transport.off('incomming-rawdata', this.handleTransportIncommingRawData);
        this.transport = null;

        this.connected = false;
        this.emit('close');

        while (this.calls.length) {
            const call = this.calls.pop();

            this.handleUnitOffline(call.unitId);
            call.reject(new Error('Connection closed.'));
        }

        this.calls = [];

        for (const unitId of Object.keys(this.onlineUnits)) {
            this.handleUnitOffline(unitId);
        }

        this.onlineUnits = {};
        this.offlineUnits = {};
    }

    async handleTransportError(error) {
        this.emit('error', error);
        this.destroy();
        if (this.config.reconnect) this.retryConnectionTimeout = setTimeout(this.connect.bind(this), this.config.retryConnectionInterval);
    }

    async handleTransportClose() {
        this.destroy();
        if (this.config.reconnect) this.retryConnectionTimeout = setTimeout(this.connect.bind(this), this.config.retryConnectionInterval);
    }

    async handleTransportRequest(request, name, extra) {
        this.emit('request', request, name, extra, (...args) => {
            this.response(name, extra, ...args);
        });
    }

    async handleTransportResponse(request, name, extra) {
        this.emit('response', request, name, extra);
    }

    async handleTransportOugoingRawData(buffer) {
        this.emit('outgoing-rawdata', buffer);
    }

    async handleTransportIncommingRawData(buffer) {
        this.emit('incomming-rawdata', buffer);
    }
}

module.exports = Modbus;
