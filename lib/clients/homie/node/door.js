const BaseNodeBridge = require('homie-sdk/lib/Bridge/Node');

const TokenSensor = require('./../sensors/token');
const StateSensor = require('./../sensors/state');

class Door {
    constructor(id) {
        this.id   = 'd';
        this.name = 'Door';

        this.instance = undefined;
        this.bridgeId = id;
    }

    init() {
        this.instance = new BaseNodeBridge({
            id   : this.id,
            name : this.name
        });

        this._addStateSensor();
        this._addTokenSensor();

        this.instance.connected = true;
    }

    _addStateSensor() {
        const sensor = new StateSensor(this.bridgeId);

        sensor.init();
        this.instance.addSensor(sensor.instance);
    }

    _addTokenSensor() {
        const sensor = new TokenSensor();

        sensor.init();
        this.instance.addSensor(sensor.instance);
    }
}

module.exports = Door;
