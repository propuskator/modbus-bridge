const { UPDATE_POLL_INTERVAL } = require('../../../../etc/constants.config');
const ModbusTransport = require('../transports/modbus');
const BooleanParser = require('../parsers/BooleanParser');
const BaseProperty = require('../base/property');
const { buzzer } = require('./../../../../etc/mqtt.config');

class Buzzer extends BaseProperty {
    constructor() {
        super('option');

        this.id       = 'bz';
        this.name     = 'Buzzer';
        this.settable = true;
        this.retained = true;
        this.dataType = 'boolean';

        this.stateKey  = `options.${buzzer}`;

        this.parser    = this._createParser();
        this.transport = this._createTransport();
    }

    async handleSet(value) {
        const res = await this.instance.bridge.modbusClient.setBuzzer(value, this.stateKey);

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

module.exports = Buzzer;
