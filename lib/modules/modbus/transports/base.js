const Events = require('events');
const Promise = require('bluebird');
const PDU = require('../pdu');
const Mutex = require('../utils/mutex');

class BaseTransport extends Events {
    constructor({ connection, requestTimeout = 10000, drainTimeout = 100 }) {
        super();

        this.buffer = Buffer.from([]);

        this.connection = connection;

        this.handleData = this.handleData.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);
        this.handleError = this.handleError.bind(this);

        this.connection.on('data', this.handleData);
        this.connection.on('close', this.handleDisconnected);
        this.connection.on('error', this.handleError);

        this.mutex = new Mutex();

        this.requestTimeout = requestTimeout;
        this.drainTimeout = drainTimeout;

        this.pendingRequest = null;
        this._drainTimeout = null;
    }


    handleData(data) {
        this.emit('incomming-rawdata', data);

        try {
            clearTimeout(this._drainTimeout);
            this._drainTimeout = setTimeout(() => {
                this.emit('unhandledBuffer', this.buffer);
                this.buffer = Buffer.from([]);
            }, this.drainTimeout);
            this.buffer = Buffer.concat([ this.buffer, data ]);
            const unwrapped = this.unwrap(this.buffer);

            if (!unwrapped) return;

            if (this.pendingRequest) {
                // suppose its respoonse
                // if (this.pendingRequest.key !== unwrapped.key) return;
                const response = PDU.Response(unwrapped.pdu);

                this.emit('response', response, PDU[response.code].Name, unwrapped.extra);
                if (typeof response.exception !== 'undefined') {
                    const error = new Error(response.exception);

                    error.response = response;
                    this.pendingRequest.reject(error);
                } else {
                    this.pendingRequest.resolve(response);
                }
            } else {
                // suppose its request
                const request = PDU.Request(unwrapped.pdu);

                // add error function to request
                request.errorResponse = (buffer) => {
                    return this.errorResponse(buffer, unwrapped.extra);
                };

                this.emit('request', request, PDU[request.code].Name, unwrapped.extra, async (...args) => {
                    return this.response(PDU[request.code].Name, unwrapped.extra, ...args);
                });
            }

            this.buffer = this.buffer.slice(unwrapped.length);
            if (!this.buffer.length) clearTimeout(this._drainTimeout);
        } catch (e) {
            this.emit('error', e);
        }
    }

    handleDisconnected(error) {
        clearTimeout(this._drainTimeout);

        this.emit('close', error);
    }

    handleError(error) {
        this.emit('error', error);
    }

    async request(fname, extra, ...args) {
        const requestTimeout = extra.timeout || this.requestTimeout;

        if (this.mutex.locked) {
            await new Promise(r => {
                setTimeout(r, 1000);
            });
        }

        return await this.mutex.do(async () => {
            // eslint-disable-next-line no-async-promise-executor
            const promise = new Promise(async (resolve, reject) => {
                const { key, buffer } = this.wrap(PDU[fname].Request.build(...args), extra);

                this.pendingRequest = { key, resolve, reject };

                await this.write(buffer);
            }).timeout(requestTimeout).finally(() => {
                this.pendingRequest = null;
            });

            return await promise;
        });
    }

    async response(fname, extra, ...args) {
        if (this.mutex.locked) throw new Error('I\'m busy');

        return await this.mutex.do(async () => {
            const { buffer } = this.wrap(PDU[fname].Response.build(...args), extra);

            await this.write(buffer);
        });
    }

    // error function
    async errorResponse(pdu, extra) {
        if (this.mutex.locked) throw new Error('I\'m busy');
        return await this.mutex.do(async () => {
            const { buffer } = this.wrap(pdu, extra);

            await this.write(buffer);
        });
    }

    async write(buffer) {
        this.emit('outgoing-rawdata', buffer);

        return this.connection.write(buffer);
    }

    destroy() {
        this.connection.destroy();

        this.connection.off('data', this.handleData);
        this.connection.off('close', this.handleDisconnected);
        this.connection.off('error', this.handleError);

        this.connection = null;
    }
}

module.exports = BaseTransport;
