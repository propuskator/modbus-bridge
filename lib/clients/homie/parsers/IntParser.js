const BaseParser = require('homie-sdk/lib/Bridge/BaseParser');

class IntParser extends BaseParser {
    constructor(config) {
        super(config);

        this.homieDataType = 'float';
        this.type = 'float';
    }

    fromHomie(data) {
        const result = parseInt(data, 10);

        if (isNaN(result)) throw new Error('Wrong format');
        return [ Buffer.from([ Math.floor(result / 256), result % 256 ]) ];
    }

    toHomie(data) {
        return `${data}`;
    }
}

module.exports = IntParser;
