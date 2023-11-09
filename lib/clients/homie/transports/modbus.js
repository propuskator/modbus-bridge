const BasePropertyTransport = require('homie-sdk/lib/Bridge/BasePropertyTransport');
const { triggerMode: tm } = require('../../../../etc/mqtt.config');
const { Logger } = require('../../../utils/Logger');

class ModbusTransport extends BasePropertyTransport {
    constructor(config) {
        super(config);

        this.handleConnected = this.handleConnected.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);

        this.log = Logger('HomieModbusTransport');

        this.stateKey = config.stateKey;

        if (config.methods) this._overrideMethods(config.methods);
    }

    attachBridge(bridge) {
        super.attachBridge(bridge);
        this.enablePolling();
    }

    async checkIsOpenedDoor(instance) {
        const openDoorTime = await this.bridge.state.get(instance);
        const triggerMode = await this.bridge.state.get(`options.${tm}`);

        if (triggerMode) return;

        this.log.verbose(`Set timeout ${openDoorTime} sec before closing door`);
        if (!isNaN(openDoorTime) && !triggerMode) {
            if (this.resetTimeout) clearTimeout(this.resetTimeout);

            this.resetTimeout = setTimeout(async () => {
                try {
                    this.log.verbose('Opened door timeout is over...');
                    await this.bridge.modbusClient.isDoorOpened();
                } catch (e) {
                    this.log.error(e);
                }
            }, openDoorTime * 1000);
        }
    }

    async getDataFromReader() {
        if (!this._isStorageAvailable()) return;

        return this.bridge.state.get(this.stateKey);
    }

    async set(data) {
        try {
            if (!this.bridge.isReaderOnline) {
                throw new Error(`Reader-${this.id} is offline`);
            }

            const res = await this.customSet(data);

            super.set(res);
            return res;
        } catch (e) {
            // eslint-disable-next-line more/no-duplicated-chains
            if (this.bridge.isReaderOnline) {
                this.log.warn('Cant\'t open dooor:');
                this.log.warn(e);
            }

            throw e;
        }
    }

    async get() {
        return this.getDataFromReader();
    }

    async handleConnected() {
        this.enablePolling();
    }

    async handleDisconnected() {
        this.disablePolling();
    }

    _overrideMethods(methods) {
        Object.keys(methods).forEach(method => this[method] = methods[method]);
    }

    _isStorageAvailable() {
        return this.bridge && this.bridge.state;
    }
}

module.exports = ModbusTransport;
