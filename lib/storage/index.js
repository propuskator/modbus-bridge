const _get = require('lodash/get');
const _set = require('lodash/set');

class Storage {
    constructor() {
        this.state = {};
    }

    set(key, value) {
        _set(this.state, key, value);
    }

    get(key) {
        return _get(this.state, key);
    }
}

module.exports = Storage;
