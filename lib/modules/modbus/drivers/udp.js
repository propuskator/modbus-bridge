// TODO

// eslint-disable-next-line no-unused-vars
const dgram    = require('dgram');
const { Connection, Server } = require('./base');

class UdpConnection extends Connection {
    /*
        options - object
            .* - see Base.constructor options
            .port = 502
            .port = 'localhost'
    */
    // eslint-disable-next-line no-unused-vars
    constructor({ port = 502, host = 'localhost' }) {
        super();
    }
}

// eslint-disable-next-line no-unused-vars
class TUdpServer extends Server {
    // eslint-disable-next-line no-unused-vars
    constructor(socket) {
        super();
        // eslint-disable-next-line no-undef
        this.server = server;
        this.connections = new Set();
        // eslint-disable-next-line no-shadow
        this.server.on('connection', socket => {
            const connection = new UdpConnection(socket);

            this.connections.add(connection);
            connection.on('data', () => this.emit('connection:data', connection));
            connection.on('error', error => this.emit('connection:error', error, connection));
            connection.on('close', () => {
                this.connections.delete(connection);
                this.emit('connection:close', connection);
            });
            this.emit('connection', connection);
        });
    }

    async close() {
        await Promise.fromCallback(cb => {
            this.server.close(cb);
            for (const connection of this.server) connection.destroy();
        });
    }

    async write(buffer) {
        await Promise.all([ ...this.connections ].map(connection => connection.write(buffer)));
    }
}

// eslint-disable-next-line no-unused-vars
module.exports.listen = async ({ timeout: listenTimeout = 10000, port = 502, address = '0.0.0.0', ...options } = {}) => {
    throw new Error('not implemeted yet');
    // options = {
    //     type : 'udp4',
    //     ...options
    // };

    // const socket = dgram.createSocket(options);

    // // bind socket
    // await new Promise((resolve, reject) => {
    //     const clear = () => {
    //         clearTimeout(timeout);
    //         socket.off('error', onError);
    //         socket.off('listening', onListening);
    //         socket.close();
    //     };

    //     const onListening = () => {
    //         clear();
    //         resolve();
    //     };

    //     const onError = error => {
    //         clear();
    //         reject(error);
    //     };

    //     const onTimeout = () => {
    //         clear();
    //         reject(new Error(`Timeout(${listenTimeout}ms) error while staring server`));
    //     };

    //     let timeout = null;

    //     if (listenTimeout > 0) timeout = setTimeout(onTimeout, listenTimeout);
    //     socket.on('error', onError);
    //     socket.on('listening', onListening);

    //     socket.bind(port, address);
    // });

    // // connect socket to itself
    // await new Promise((resolve, reject) => {
    //     const clear = () => {
    //         clearTimeout(timeout);
    //         socket.off('error', onError);
    //         socket.off('connect', onConnect);
    //         socket.close();
    //     };

    //     const onConnect = () => {
    //         clear();
    //         resolve();
    //     };

    //     const onError = error => {
    //         clear();
    //         reject(error);
    //     };

    //     const onTimeout = () => {
    //         clear();
    //         reject(new Error(`Timeout(${connectTimeout}ms) error while connecting to ${options.host}:${options.port}`));
    //     };

    //     let timeout = null;

    //     if (listenTimeout > 0) timeout = setTimeout(onTimeout, listenTimeout);
    //     socket.on('error', onError);
    //     socket.on('connect', onConnect);

    //     socket.connect(port, address);
    // });

    // return new TUdpServer(socket);
};

// eslint-disable-next-line no-unused-vars
module.exports.connect = async ({ timeout: connectTimeout = 10000, port = 502, address = '0.0.0.0', ...options } = {}) => {
    throw new Error('not implemeted yet');
    // options = {
    //     type : 'udp4',
    //     ...options
    // };

    // const socket = dgram.createSocket(options);

    // await new Promise((resolve, reject) => {
    //     const clear = () => {
    //         clearTimeout(timeout);
    //         socket.off('error', onError);
    //         socket.off('connect', onConnect);
    //         socket.close();
    //     };

    //     const onConnect = () => {
    //         clear();
    //         resolve();
    //     };

    //     const onError = error => {
    //         clear();
    //         reject(error);
    //     };

    //     const onTimeout = () => {
    //         clear();
    //         reject(new Error(`Timeout(${connectTimeout}ms) error while connecting to ${options.host}:${options.port}`));
    //     };

    //     let timeout = null;

    //     if (connectTimeout > 0) timeout = setTimeout(onTimeout, connectTimeout);
    //     socket.on('error', onError);
    //     socket.on('connect', onConnect);

    //     socket.connect(port, address);
    // });

    // return new UdpConnection(socket);
};
