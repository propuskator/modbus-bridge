const BasePropertyBridge = require('homie-sdk/lib/Bridge/BaseProperty');

class BaseProperty {
    constructor(type = 'sensor') {
        this.config = undefined;
        this.type = type;
    }

    init() {
        this._initConfig();

        this.instance = new BasePropertyBridge(this.config, {
            type      : this.type,
            parser    : this.parser,
            transport : this.transport
        });
    }

    _initConfig() {
        this.config = {
            id       : this.id,
            name     : this.name,
            settable : this.settable,
            retained : this.retained,
            dataType : this.dataType,
            format   : this.format,
            unit     : this.unit
        };
    }
}

module.exports = BaseProperty;
