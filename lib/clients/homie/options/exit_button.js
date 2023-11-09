const { UPDATE_POLL_INTERVAL } = require('../../../../etc/constants.config');
const ModbusTransport = require('../transports/modbus');
const BooleanParser = require('../parsers/BooleanParser');
const BaseProperty = require('../base/property');
const { exitBtn } = require('./../../../../etc/mqtt.config');

class ExitBtn extends BaseProperty {
    constructor() {
        super('option');

        this.id       = 'exiten';
        this.name     = 'Exit button';
        this.settable = true;
        this.retained = true;
        this.dataType = 'boolean';

        this.stateKey  = `options.${exitBtn}`;

        this.parser    = this._createParser();
        this.transport = this._createTransport();
    }

    async handleSet(value) {
        const res = await this.instance.bridge.modbusClient.setExitBtn(value, this.stateKey);

        return res;
    }

    _createTransport() {
        return new ModbusTransport({
            ...this,
            pollInterval : UPDATE_POLL_INTERVAL,
            methods      : {
                customSet : this.handleSet.bind(this)
            }
        });
    }

    _createParser() {
        return new BooleanParser();
    }
}

module.exports = ExitBtn;
