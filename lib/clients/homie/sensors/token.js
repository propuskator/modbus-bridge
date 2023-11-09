const { UPDATE_POLL_INTERVAL } = require('../../../../etc/constants.config');
const ModbusTransport = require('../transports/modbus');
const StringParser = require('../parsers/StringParser');
const BaseProperty = require('../base/property');
const { doorOpened, openDoorTime: odt } = require('../../../../etc/mqtt.config');

class Token extends BaseProperty {
    constructor() {
        super();

        this.id       = 'k';
        this.name     = 'Token';
        this.settable = true;
        this.retained = false;
        this.dataType = 'string';

        this.stateKey  = `options.${doorOpened}`;

        this.parser    = this._createParser();
        this.transport = this._createTransport();
    }

    async handleSet(value) {
        const res = await this.instance.bridge.modbusClient.setToken(value);

        if (!res) throw Error('Permission denied!');

        await this.transport.checkIsOpenedDoor(`options.${odt}`);
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
        return new StringParser();
    }
}

module.exports = Token;
