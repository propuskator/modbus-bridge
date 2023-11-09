const { UPDATE_POLL_INTERVAL } = require('../../../../etc/constants.config');
const IntParser = require('../parsers/IntParser');
const ModbusTransport = require('../transports/modbus');
const BaseProperty = require('../base/property');
const { openDoorTime } = require('./../../../../etc/mqtt.config');

class OpenDoorTime extends BaseProperty {
    constructor() {
        super('option');

        this.id       = 'odt';
        this.name     = 'Open door time';
        this.settable = true;
        this.retained = true;
        this.dataType = 'float';
        this.unit     = 's';

        this.stateKey  = `options.${openDoorTime}`;

        this.parser    = this._createParser();
        this.transport = this._createTransport();
    }

    async handleSet(value) {
        const res = await this.instance.bridge.modbusClient.setOpenDoorTime(value, this.stateKey);

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
        return new IntParser();
    }
}

module.exports = OpenDoorTime;
