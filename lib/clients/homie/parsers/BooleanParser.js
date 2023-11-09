const BaseParser = require('homie-sdk/lib/Bridge/BaseParser');

class BooleanParser extends BaseParser {
    constructor(config) {
        super(config);

        this.homieDataType = 'boolean';
        this.type = 'boolean';
        this.on = 1;
        this.off = 0;
    }

    fromHomie(data) {
        const cmd = (data === 'true' || data === true) ? this.on : this.off;

        return [ Buffer.from([ 0, cmd ]) ];
    }

    toHomie(data) {
        return `${data}`;
    }
}

module.exports = BooleanParser;
