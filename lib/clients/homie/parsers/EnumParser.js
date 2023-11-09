const _findKey = require('lodash/findKey');
const BaseParser = require('homie-sdk/lib/Bridge/BaseParser');
const CONSTANTS = require('../../../../etc/constants.config');

class EnumParser extends BaseParser {
    constructor(config) {
        super(config);

        this.homieDataType = 'enum';
        this.type = ('type' in config) ? config.type : 'enum';
        this.enum = (config.type in CONSTANTS.ENUM_TYPES) ? CONSTANTS[config.type] : [ '' ];
    }

    fromHomie(data) {
        const val = _findKey(this.enum, v => v === data);

        if (val === undefined) throw new Error('Wrong value!');

        return [ Buffer.from([ 0, val ]) ];
    }

    toHomie(data) {
        return [ `${data}` ];
    }
}

module.exports = EnumParser;
