const net    = require('net');
const Promise = require('bluebird');
const { Connection } = require('./base');


class TcpConnection extends Connection {
    constructor(socket) {
        super();
        this.socket = socket;

        this.handleData = this.handleData.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);
        this.handleError = this.handleError.bind(this);

        this.socket.on('data', this.handleData);
        this.socket.on('close', this.handleDisconnected);
        this.socket.on('error', this.handleError);
    }

    async write(buffer) {
        await Promise.fromCallback(cb => this.socket.write(buffer, cb));
    }

    destroy() {
        this.socket.destroy();

        this.socket.off('data', this.handleData);
        this.socket.off('close', this.handleDisconnected);
        this.socket.off('error', this.handleError);

        this.socket = null;
    }

    handleData(data) {
        this.emit('data', data);
    }

    handleDisconnected() {
        this.emit('close');
    }

    handleError(error) {
        this.emit('error', error);
    }
}

/*
    options - object
        .connectTimeout = 10000, timeout for connecting
        .port = 502
        .host = 'localhost'
        .* - any options to net.connect(options)
*/
module.exports.connect = async ({ ...options } = {}) => {
    options = {
        port : 502,
        host : 'localhost',
        ...options
    };

    return await new Promise((resolve, reject) => {
        const socket = net.connect(options);

        const clear = () => {
            socket.off('error', onError);
            socket.off('connect', onConnect);
        };

        const onConnect = () => {
            clear();
            resolve(new TcpConnection(socket));
        };

        const onError = error => {
            clear();
            socket.destroy();
            reject(error);
        };

        socket.on('error', onError);
        socket.on('connect', onConnect);
    });
};
