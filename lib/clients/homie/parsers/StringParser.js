const BaseParser = require('homie-sdk/lib/Bridge/BaseParser');

class StringParser extends BaseParser {
    constructor(config) {
        super(config);

        this.homieDataType = 'string';
        this.type = 'string';
    }

    fromHomie(data) {
        if (typeof data !== 'string') throw new Error('Wrong format');

        return [ Buffer.from(data, 'utf8') ];
    }

    toHomie(data) {
        return `${data}`;
    }
}

module.exports = StringParser;
