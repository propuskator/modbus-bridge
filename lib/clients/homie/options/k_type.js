const { UPDATE_POLL_INTERVAL, ENUM_TYPES } = require('../../../../etc/constants.config');
const ModbusTransport = require('../transports/modbus');
const EnumParser = require('../parsers/EnumParser');
const BaseProperty = require('../base/property');
const instance = require('./../../../../etc/mqtt.config');

class KType extends BaseProperty {
    constructor(id = 1) {
        super('option');

        this.id       = `k${id}t`;
        this.name     = `K${id} type`;
        this.settable = true;
        this.retained = true;
        this.dataType = 'enum';
        this.format   = 'NO,NC';

        this.stateKey = `options.${instance[`k${id}Type`]}`;

        this.parser    = this._createParser();
        this.transport = this._createTransport();
    }

    async handleSet(value) {
        const res = await this.instance.bridge.modbusClient.setKType(value, this.stateKey, this.id);

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
            type : ENUM_TYPES.K_TYPE
        });
    }
}

module.exports = KType;
