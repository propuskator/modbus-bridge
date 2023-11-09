const BaseDeviceBridge = require('homie-sdk/lib/Bridge/Device');

const DoorNode = require('./node/door');

const BuzzerOption          = require('./options/buzzer');
const ExitBtn               = require('./options/exit_button');
const KState                = require('./options/k_state');
const KType                 = require('./options/k_type');
const LockType              = require('./options/lock_type');
const RreaderType           = require('./options/reader_type');
const OpenDoorTime          = require('./options/open_door_time');
const PermissionInEmergency = require('./options/permission_in_emergency');
const TriggerMode           = require('./options/trigger_mode');

class HomieReaderDevice {
    constructor(id, name) {
        this.id = id;
        this.name = name;

        this.instance = undefined;
    }

    init() {
        this.instance = new BaseDeviceBridge({
            id   : this.id,
            name : this.name
        });

        this._addDoorNode();

        this._addBuzzerOption();
        this._addExitBtnOption();
        this._addKStateOption(1); // k1 type
        this._addKStateOption(2); // k2 type
        this._addKTypeOption(1); // k1 type
        this._addKTypeOption(2); // k2 type
        this._addLockTypeOption();
        this._addReaderTypeOption();
        this._addOpenDoorTimeOption();
        this._addPermissionInEmergencyOption();
        this._addTriggerModeOption();

        this.instance.connected = true;
    }

    _addDoorNode() {
        const node = new DoorNode(this.id);

        node.init();
        this.instance.addNode(node.instance);
    }

    _addBuzzerOption() {
        const option = new BuzzerOption();

        option.init();
        this.instance.addOption(option.instance);
    }

    _addExitBtnOption() {
        const option = new ExitBtn();

        option.init();
        this.instance.addOption(option.instance);
    }

    _addKStateOption(id = 1) {
        const option = new KState(id);

        option.init();
        this.instance.addOption(option.instance);
    }

    _addKTypeOption(id = 1) {
        const option = new KType(id);

        option.init();
        this.instance.addOption(option.instance);
    }

    _addLockTypeOption() {
        const option = new LockType();

        option.init();
        this.instance.addOption(option.instance);
    }

    _addReaderTypeOption() {
        const option = new RreaderType();

        option.init();
        this.instance.addOption(option.instance);
    }

    _addOpenDoorTimeOption() {
        const option = new OpenDoorTime();

        option.init();
        this.instance.addOption(option.instance);
    }

    _addPermissionInEmergencyOption() {
        const option = new PermissionInEmergency();

        option.init();
        this.instance.addOption(option.instance);
    }

    _addTriggerModeOption() {
        const option = new TriggerMode();

        option.init();
        this.instance.addOption(option.instance);
    }
}

module.exports = HomieReaderDevice;
