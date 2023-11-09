const { UPDATE_POLL_INTERVAL, ENUM_TYPES } = require('../../../../etc/constants.config');
const BaseProperty = require('../base/property');
const ModbusTransport = require('../transports/modbus');
const EnumParser = require('../parsers/EnumParser');
const { rfidType } = require('./../../../../etc/mqtt.config');

class ReaderType extends BaseProperty {
    constructor() {
        super('option');

        this.id       = 'r';
        this.name     = 'Reader type';
        this.settable = true;
        this.retained = true;
        this.dataType = 'enum';
        this.format   = 'Wiegand,1-Wire';

        this.stateKey  = `options.${rfidType}`;

        this.parser    = this._createParser();
        this.transport = this._createTransport();
    }

    async handleSet(value) {
        const res = await this.instance.bridge.modbusClient.setReaderType(value, this.stateKey);

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
        return new EnumParser({
            type : ENUM_TYPES.READER_TYPE
        });
    }
}

module.exports = ReaderType;
