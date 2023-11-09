const { UPDATE_POLL_INTERVAL } = require('../../../../etc/constants.config');
const ModbusTransport = require('../transports/modbus');
const BooleanParser = require('../parsers/BooleanParser');
const BaseProperty = require('../base/property');
const { doorOpened, openDoorTime : odt } = require('../../../../etc/mqtt.config');
const { Logger } = require('./../../../utils/Logger');

class State extends BaseProperty {
    constructor(bridgeId) {
        super();

        this.id       = 's';
        this.name     = 'State';
        this.settable = true;
        this.retained = true;
        this.dataType = 'boolean';

        this.stateKey  = `options.${doorOpened}`;

        this.parser    = this._createParser();
        this.transport = this._createTransport();

        this.log = Logger(`[${bridgeId}] door state`);
    }

    async handleSet(value) {
        const res = await this.instance.bridge.modbusClient.openDoor(value, this.stateKey);

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
        return new BooleanParser({
            on  : 1,
            off : 0
        });
    }
}

module.exports = State;
