const EventEmitter = require('events');

EventEmitter.defaultMaxListeners = 0;
const Promise      = require('bluebird');
const queue        = require('queue');

const {
    MODBUS_RESET_CONN_INTVL,
    MODBUS_RETRY_CONN_INTVL,
    MODBUS_CONN_TIMEOUT,
    MODBUS_CALL_RETRIES,
    MODBUS_MAX_PARALLEL_CALLS
} = require('../../etc/constants.config');
const Drivers = require('../modules/modbus/drivers');
const Transports = require('../modules/modbus/transports');
const { Logger } = require('../utils/Logger');

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
        this.retryConnectionPromise = null;

        this.queue = queue({ concurrency: 1, autostart: true });

        this.handleTransportError = this.handleTransportError.bind(this);
        this.handleTransportClose = this.handleTransportClose.bind(this);
        this.handleTransportRequest = this.handleTransportRequest.bind(this);
        this.handleTransportResponse = this.handleTransportResponse.bind(this);
        this.handleTransportOugoingRawData = this.handleTransportOugoingRawData.bind(this);
        this.handleTransportIncommingRawData = this.handleTransportIncommingRawData.bind(this);

        this.log = Logger('transports/modbus');
    }

    priorityQueuing() {
        this.queue.jobs.sort((a, b) => b.extra.priority - a.extra.priority);
    }

    async clearQueue(slaveId) {
        const err = new Error(`Reader-${slaveId} is offline`);

        // clear queue of modbus requests
        for (let i = this.queue.jobs.length - 1; i >= 0; i--) {
            if (this.queue.jobs[i].extra.unitId === slaveId) {
                this.queue.jobs[i].extra.retryCount = 0;
                const promise = await this.queue.splice(i, 1);

                await promise[0].reject(err);
            }
        }
    }

    async request(fname, extra, ...args) {
        return this._call('request', fname, extra, ...args);
    }

    async response(fname, extra, ...args) {
        return this._call('response', fname, extra, ...args);
    }

    async _call(name, fname, extra, ...args) {
        const call = {};

        const run = async () => {
            if (!this.connected) {
                const err =  new Error('Modbus connection is not established.');

                call.reject(err);
                call.cb(null, null);
                return;
            }

            try {
                const result = await this.transport[name](fname, extra, ...args);

                // this.handleUnitOnline(call.unitId); // ??? нужно ли это
                call.resolve(result);
            } catch (error) {
                if (!error.hasOwnProperty('retry')) error.retry = true;

                call.reject(error);
            } finally {
                call.cb(null, null);
            }
        };

        call.run = run;

        const promise = new Promise((resolve, reject) => {
            call.resolve = resolve;
            call.reject = reject;

            const func = cb => {
                call.cb = cb;
                call.run();
            };

            func.extra = extra;
            func.reject = call.reject;

            this.queue.push(func);
            this.priorityQueuing();
        });

        return promise;
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
            this.connecting = false;
            this.refreshResetConnectionTimeout();
        } catch (error) {
            this.log.error(error.message);

            this.connecting = false;
            this.connected = false;

            try {
                if (this.config.reconnect) {
                    await new Promise((resolve) => setTimeout(() => resolve(), this.config.retryConnectionInterval));
                    await this.reconnect();
                }
            } catch (e) {
                this.log.error(' connect:');
                this.log.error(e);
            }
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
        if (this.config.driver.type === 'tcp') {
            this.log.verbose('Reset connection');
            clearTimeout(this.resetConnectionTimeout);

            this.resetConnectionTimeout = setTimeout(async () => {
                await this.reconnect();
            }, this.config.resetConnectionInterval);
        }
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
    }

    async handleTransportError(error) {
        this.emit('error', error);
        await this.reconnect();
    }

    async handleTransportClose() {
        await this.reconnect();
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
