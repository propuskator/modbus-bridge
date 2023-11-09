const { UPDATE_POLL_INTERVAL } = require('../../../../etc/constants.config');
const ModbusTransport = require('../transports/modbus');
const BooleanParser = require('../parsers/BooleanParser');
const BaseProperty = require('../base/property');
const instance = require('./../../../../etc/mqtt.config');

class KState extends BaseProperty {
    constructor(id = 1) {
        super('option');

        this.id       = `k${id}`;
        this.name     = `K${id}`;
        this.settable = false;
        this.retained = true;
        this.dataType = 'boolean';

        this.stateKey = `options.${instance[`k${id}`]}`;

        this.parser    = this._createParser();
        this.transport = this._createTransport();
    }

    _createTransport() {
        return new ModbusTransport({
            ...this,
            pollInterval : UPDATE_POLL_INTERVAL
        });
    }

    _createParser() {
        return new BooleanParser();
    }
}

module.exports = KState;
