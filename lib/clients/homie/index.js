
const HomieReaderDevice = require('./device');

class HomieReader {
    constructor({ id, name }) {
        this.id        = id;
        this.name      = name;

        this.device = undefined;
    }

    async init() {
        this.device = new HomieReaderDevice(this.id, this.name);

        this.device.init();
    }

    connect() {
        this.homieDevice.connected = true;
    }

    disconnect() {
        this.homieDevice.connected = false;
    }

    get homieDevice() {
        return this.device.instance;
    }
}

module.exports = HomieReader;
