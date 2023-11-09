const SerialPort = require('serialport');
const Promise = require('bluebird');

const { Connection } = require('./base');

class SerialConnection extends Connection {
    constructor(serialport) {
        super();
        this.serialport = serialport;

        this.handleData = this.handleData.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);
        this.handleError = this.handleError.bind(this);

        this.serialport.on('data', this.handleData);
        this.serialport.on('close', this.handleDisconnected);
        this.serialport.on('error', this.handleError);
    }

    async write(buffer) {
        await Promise.fromCallback(cb => this.serialport.write(buffer, cb));
    }

    destroy() {
        this.socket.off('data', this.handleData);
        this.socket.off('close', this.handleDisconnected);
        this.socket.off('error', this.handleError);

        this.serialport.close();
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

module.exports.connect = async ({ path = '/dev/ttyS0', ...options } = {}) => {
    options = {
        baudRate : 9600,
        dataBits : 8,
        stopBits : 1,
        parity   : 'none',
        ...options,
        autoOpen : false
    };

    const serialport = new SerialPort(path, options);

    const nope = () => {};


    serialport.on('error', nope);
    await Promise.fromCallback(cb => serialport.open(cb));
    serialport.off('error', nope);

    return new SerialConnection(serialport);
};
