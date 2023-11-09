const queue = require('queue');

const Modbus = require('../../../lib/transports/modbus');
const ModbusTransport = require('../../utils/modbusTransport');

jest.mock('../../../lib/modules/modbus/drivers/serial');
jest.mock('../../../lib/modules/modbus/transports/serial');

const modbus = new Modbus();

jest.setTimeout(30000);

// eslint-disable-next-line max-lines-per-function
describe('Modbus transport', () => {
    describe('priorityQueuing', () => {
        it('positive: sort unsorted array', async () => {
            modbus.queue.jobs = [ { extra: { data: 'a', priority: 0 } }, { extra: { data: 'b', priority: 1 } },
                { extra: { data: 'c', priority: 2 } }, { extra: { data: 'd', priority: 3 } } ];
            modbus.priorityQueuing();

            expect(modbus.queue.jobs).toEqual([ { extra: { data: 'd', priority: 3 } }, { extra: { data: 'c', priority: 2 } },
                { extra: { data: 'b', priority: 1 } }, { extra: { data: 'a', priority: 0 } } ]);
        });
        it('positive: sort sorted array', async () => {
            modbus.queue.jobs = [ { extra: { data: 'd', priority: 3 } }, { extra: { data: 'c', priority: 2 } },
                { extra: { data: 'b', priority: 1 } }, { extra: { data: 'a', priority: 0 } } ];
            modbus.priorityQueuing();

            expect(modbus.queue.jobs).toEqual([ { extra: { data: 'd', priority: 3 } }, { extra: { data: 'c', priority: 2 } },
                { extra: { data: 'b', priority: 1 } }, { extra: { data: 'a', priority: 0 } } ]);
        });
        it('positive: sort empty array', async () => {
            modbus.queue.jobs = [];
            modbus.priorityQueuing([]);

            expect(modbus.queue.jobs).toEqual([]);
        });
    });

    describe('clearQueue', () => {
        it('positive: clear queue when slaveId=0', async () => {
            const funcZero = () => {};

            const arr = [];

            funcZero.extra = { unitId: 0 };
            funcZero.reject = () => {};

            for (let i = 1; i <= 5; i++) {
                const func = () => {};

                func.extra = { unitId: i };
                modbus.queue.push(funcZero);
                modbus.queue.push(func);
                arr.push(func);
            }

            await modbus.clearQueue(0);

            expect(modbus.queue.jobs).toEqual(arr);
        });
        it('positive: clear empty queue', async () => {
            modbus.queue.jobs = [];
            await modbus.clearQueue(0);

            expect(modbus.queue.jobs).toEqual([]);
        });
    });

    describe('_call', () => {
        modbus.transport = new ModbusTransport(0);
        it('positive: add request to queue (ReadHoldingRegisters)', async () => {
            modbus.queue = queue({ concurrency: 1, autostart: true });
            modbus.connected = true;
            const result = await modbus._call('request', 'ReadHoldingRegisters', { unitId: 0 }, 0, 5);

            expect(result).toEqual({
                data : [
                    Buffer.from([ 0, 0 ]),
                    Buffer.from([ 0, 1 ]),
                    Buffer.from([ 0, 2 ]),
                    Buffer.from([ 0, 3 ]),
                    Buffer.from([ 0, 4 ])
                ]
            });
        });
        it('negative: Modbus connection is not established', async () => {
            modbus.queue = queue({ concurrency: 1, autostart: true });
            modbus.connected = false;

            async function options() {
                await modbus._call('request', 'ReadHoldingRegisters', { unitId: 0 }, 0, 5);
            }

            await expect(options).rejects.toThrowError(new Error('Modbus connection is not established.'));
        });
        it('negative: bad slaveId', async () => {
            modbus.queue = queue({ concurrency: 1, autostart: true });
            modbus.connected = true;

            async function options() {
                await modbus._call('request', 'ReadHoldingRegisters', { unitId: 1 }, 0, 5);
            }

            await expect(options).rejects.toThrowError(new Error('Request timed out'));
        });
        it('positive: add many unsorted request to queue', async () => {
            const arr = [];

            for (let i = 3; i >= 1; i--) {
                const func = () => {};

                func.extra = { unitId: i, priority: i };

                await new Promise((resolve, reject) => {
                    func.reject = reject;
                    resolve();
                });

                arr.push(func);
            }

            modbus.transport = {
                'request' : () => {
                    return new Promise(() => {});
                }
            };
            modbus.queue = queue({ concurrency: 1, autostart: true });
            modbus.connected = true;

            modbus._call('request', 'ReadHoldingRegisters', { unitId: 0, priority: 0 }, 0, 5);
            modbus._call('request', 'ReadHoldingRegisters', { unitId: 1, priority: 1 }, 0, 5);
            modbus._call('request', 'ReadHoldingRegisters', { unitId: 2, priority: 2 }, 0, 5);
            modbus._call('request', 'ReadHoldingRegisters', { unitId: 3, priority: 3 }, 0, 5);

            await modbus.queue.jobs.map((el, k) => expect(el.extra).toEqual(arr[k].extra));
        });
    });

    describe('connect', () => {
        it('negative: already connected', async () => {
            modbus.connected = true;
            modbus.connecting = false;

            async function options() {
                await modbus.connect();
            }

            await expect(options).rejects.toThrowError(new Error('already connected'));
        });
        it('negative: already connecting', async () => {
            modbus.connected = false;
            modbus.connecting = true;

            async function options() {
                await modbus.connect();
            }

            await expect(options).rejects.toThrowError(new Error('already connecting'));
        });
        it('positive: connect', async () => {
            modbus.connected = false;
            modbus.connecting = false;
            modbus.config.driver = {
                type       : 'serial',
                connection : {
                    serial : {}
                }
            };
            modbus.config.transport = {
                type : 'serial'
            };

            await modbus.connect();

            expect(modbus.connected).toBe(true);
            expect(modbus.connecting).toBe(false);
        });
    });

    describe('disconnect', () => {
        it('positive: from connected to disconnected', async () => {
            modbus.connected = false;

            await modbus.connect();
            expect(modbus.connected).toBe(true);

            modbus.destroy();
            expect(modbus.connected).toBe(false);
        });
        it('positive: diconnect already disconnected', async () => {
            modbus.destroy();
            const result = modbus.destroy();

            expect(result).toBe(undefined);
        });
    });
});
