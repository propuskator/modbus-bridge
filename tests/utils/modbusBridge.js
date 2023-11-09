class Bridge {
    constructor() {
        this.state = new State();
    }
}

class State {
    set(key, value) {
        this[key] = value;
    }

    get(key) {
        return this[key];
    }
}

module.exports = Bridge;
