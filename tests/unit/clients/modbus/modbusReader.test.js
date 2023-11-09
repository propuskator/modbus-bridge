/* eslint-disable max-lines-per-function */
jest.setTimeout(30000);
jest.mock('../../../../lib/transports/modbus');

const ModbusReader = require('../../../../lib/clients/modbus/index');
const Transport = require('../../../utils/modbusTransport');
const Bridge = require('../../../utils/modbusBridge');

const slaveId = 1;
const bridge = new Bridge();
const tokenReader = new ModbusReader({
    slaveId,
    transport : new Transport(slaveId),
    bridge
});
const error = new Error('Request timed out');

const retryRequest = {
    retryCount : 0,
    priority   : 0,
    unitId     : 1
};
const badSlaveId = {
    retryCount : 0,
    priority   : 0,
    unitId     : 999
};

tokenReader.retryRequest = retryRequest;
tokenReader._log = () => {
    if (!tokenReader.count) tokenReader.count = 0;
    tokenReader.count++;
};


// eslint-disable-next-line max-lines-per-function
describe('ModbusReader', () => {
    describe('getStatuses', () => {
        it('positive: incorrect data', async () => {
            const result = await tokenReader.getStatuses(retryRequest);
            const data = bridge.state.get('statuses');
            const expectObj = {
                isSynchronizing    : false,
                isTimeSynchronized : true,
                haveLogs           : true,
                syncTimestamp      : 262147
            };

            expect(result).toEqual(expectObj);
            expect(data).toEqual(expectObj);
        });

        it('negative: bad slaveId', async () => {
            async function options() {
                await tokenReader.getStatuses(badSlaveId);
            }

            await expect(options).rejects.toThrowError(error);
        });
    });

    describe('getOptions', () => {
        it('positive: incorrect data', async () => {
            const result = await tokenReader.getOptions(retryRequest);
            const data = bridge.state.get('options');
            const expectObj = {
                doorOpened            : false,
                openDoorTime          : 5,
                buzzer                : true,
                lockType              : 'Latch',
                rfidType              : '1-Wire',
                triggerMode           : true,
                permissionInEmergency : true,
                k1                    : true,
                k2                    : true,
                k1Type                : 'NC',
                k2Type                : 'NC',
                exitBtn               : true
            };

            expect(result).toEqual(expectObj);
            expect(data).toEqual(expectObj);
        });

        it('negative: bad slaveId', async () => {
            async function options() {
                await tokenReader.getOptions(badSlaveId);
            }

            await expect(options).rejects.toThrowError(error);
        });
    });

    describe('setBuzzer', () => {
        it('positive: correct data - false', async () => {
            const result = await tokenReader.setBuzzer(Buffer.from([ 0, 0 ]), 'buzzer');

            expect(result).toBe(false);
        });
        it('positive: correct data - true', async () => {
            const result = await tokenReader.setBuzzer(Buffer.from([ 0, 1 ]), 'buzzer');

            expect(result).toBe(true);
        });
    });

    describe('setKType', () => {
        it('positive: correct data - false, id 1', async () => {
            const result = await tokenReader.setKType(Buffer.from([ 0, 0 ]), 'k1Type', 'k1t');

            expect(result).toBe('NO');
        });
        it('positive: correct data - true, id 2', async () => {
            const result = await tokenReader.setKType(Buffer.from([ 0, 1 ]), 'k2Type', 'k2t');

            expect(result).toBe('NC');
        });
    });

    describe('setLockType', () => {
        it('positive: correct data - false', async () => {
            const result = await tokenReader.setLockType(Buffer.from([ 0, 0 ]), 'lockType');

            expect(result).toBe('Magnet');
        });
        it('positive: correct data - true', async () => {
            const result = await tokenReader.setLockType(Buffer.from([ 0, 1 ]), 'lockType');

            expect(result).toBe('Latch');
        });
    });

    describe('setOpenDoorTime', () => {
        it('positive: correct data - 100', async () => {
            const result = await tokenReader.setOpenDoorTime(Buffer.from([ 0, 100 ]), 'openDoorTime');

            expect(result).toBe(100);
        });
    });

    describe('setPermissionInEmergency', () => {
        it('positive: correct data - false', async () => {
            const result = await tokenReader.setPermissionInEmergency(Buffer.from([ 0, 0 ]), 'permissionInEmergency');

            expect(result).toBe(false);
        });
        it('positive: correct data - true', async () => {
            const result = await tokenReader.setPermissionInEmergency(Buffer.from([ 0, 1 ]), 'permissionInEmergency');

            expect(result).toBe(true);
        });
    });

    describe('setReaderType', () => {
        it('positive: correct data - false', async () => {
            const result = await tokenReader.setReaderType(Buffer.from([ 0, 0 ]), 'rfidType');

            expect(result).toBe('Wiegand');
        });
        it('positive: correct data - true', async () => {
            const result = await tokenReader.setReaderType(Buffer.from([ 0, 1 ]), 'rfidType');

            expect(result).toBe('1-Wire');
        });
    });

    describe('setTriggerMode', () => {
        it('positive: correct data - false', async () => {
            const result = await tokenReader.setTriggerMode(Buffer.from([ 0, 0 ]), 'triggerMode');

            expect(result).toBe(false);
        });
        it('positive: correct data - true', async () => {
            const result = await tokenReader.setTriggerMode(Buffer.from([ 0, 1 ]), 'triggerMode');

            expect(result).toBe(true);
        });
    });

    describe('setExitBtn', () => {
        it('positive: correct data - false', async () => {
            const result = await tokenReader.setExitBtn(Buffer.from([ 0, 0 ]), 'exitBtn');

            expect(result).toBe(false);
        });
        it('positive: correct data - true', async () => {
            const result = await tokenReader.setExitBtn(Buffer.from([ 0, 1 ]), 'exitBtn');

            expect(result).toBe(true);
        });
    });

    describe('openDoor', () => {
        it('positive: correct data - false', async () => {
            const result = await tokenReader.openDoor(Buffer.from([ 0, 0 ]), 'doorOpened');

            expect(result).toBe(false);
        });
        it('positive: correct data - true', async () => {
            const result = await tokenReader.openDoor(Buffer.from([ 0, 1 ]), 'doorOpened');

            expect(result).toBe(true);
        });
    });

    describe('isDoorOpened', () => {
        it('positive: correct data - false', async () => {
            await tokenReader.openDoor(Buffer.from([ 0, 0 ]), 'doorOpened');
            const result = await tokenReader.isDoorOpened();

            expect(result).toBe(false);
        });
        it('positive: correct data - true', async () => {
            await tokenReader.openDoor(Buffer.from([ 0, 1 ]), 'doorOpened');
            const result = await tokenReader.isDoorOpened();

            expect(result).toBe(true);
        });
    });

    describe('setToken', () => {
        it('positive: correct data - true', async () => {
            const result = await tokenReader.setToken(Buffer.from('token', 'utf8'), 'doorOpened');

            expect(result).toBe(true);
        });
        it('positive: correct data - false', async () => {
            const result = await tokenReader.setToken(Buffer.from('wrong_token', 'utf8'), 'doorOpened');

            expect(result).toBe(false);
        });
    });

    describe('syncTime', () => {
        it('positive: correct data', async () => {
            await tokenReader.syncTime('27213933,EET-2EEST,M3.4.0/3,M10.5.0/4,1632835995');
            const data = bridge.state.get('timezone');

            expect(data).toBe('27213933,EET-2EEST,M3.4.0/3,M10.5.0/4,1632835995');
        });
    });

    describe('cutBuffer', () => {
        it('positive: correct data', async () => {
            const result = await tokenReader.cutBuffer('27222511%sbj-JSNXEHQZFIVD%\nsbj-JSNXEHQZFIVD_/3_480_1200_1111100', 4096);

            expect(result).toEqual([ '27222511%sbj-JSNXEHQZFIVD%\nsbj-JSNXEHQZFIVD_/3_480_1200_1111100\n' ]);
        });
        it('positive: empty data', async () => {
            const result = await tokenReader.cutBuffer('', 4096);

            expect(result).toEqual([ '\n' ]);
        });
        it('positive: long data', async () => {
            const result = await tokenReader.cutBuffer('27222511%sbj-JSNXEHQZFIVD%\nsbj-JSNXEHQZFIVD_/3_480_1200_1111100\n' +
            'nsbj-JSNXEHQZFIVD_/3_480_1200_1111100\nnsbj-JSNXEHQZFIVD_/3_480_1200_1111100\nnsbj-JSNXEHQZFIVD_/3_480_1200_1111100\n' +
            'nsbj-JSNXEHQZFIVD_/3_480_1200_1111100\nnsbj-JSNXEHQZFIVD_/3_480_1200_1111100\nnsbj-JSNXEHQZFIVD_/3_480_1200_1111100', 30);

            expect(result).toEqual([ '27222511%sbj-JSNXEHQZFIVD%\n',
                'sbj-JSNXEHQZFIVD_/3_480_1200_1111100\n',
                'nsbj-JSNXEHQZFIVD_/3_480_1200_1111100\n',
                'nsbj-JSNXEHQZFIVD_/3_480_1200_1111100\n',
                'nsbj-JSNXEHQZFIVD_/3_480_1200_1111100\n',
                'nsbj-JSNXEHQZFIVD_/3_480_1200_1111100\n',
                'nsbj-JSNXEHQZFIVD_/3_480_1200_1111100\n',
                'nsbj-JSNXEHQZFIVD_/3_480_1200_1111100\n' ]);
        });
    });

    describe('getLogs && clearLogs', () => {
        it('positive: get logs from controller', async () => {
            const result = await tokenReader.getLogs();

            expect(result).toBe('Logs from controller');
        });
        it('positive: clear logs', async () => {
            const result = await tokenReader.clearLogs();
            const data = await tokenReader.getLogs();

            expect(result).toEqual({ value: Buffer.from([ 0, 1 ]) });
            expect(data).toBe('');
        });
    });

    describe('_request', () => {
        it('positive: ReadHoldingRegisters', async () => {
            const result = await tokenReader._request('ReadHoldingRegisters', retryRequest, 0, 5);

            expect(result).toEqual({ data : [
                Buffer.from([ 0, 0 ]),
                Buffer.from([ 0, 1 ]),
                Buffer.from([ 0, 2 ]),
                Buffer.from([ 0, 3 ]),
                Buffer.from([ 0, 4 ])
            ] });
        });
        it('negative: bad slaveId', async () => {
            async function options() {
                await tokenReader._request('ReadHoldingRegisters', badSlaveId, 0, 5);
            }

            await expect(options).rejects.toThrowError(error);
        });
    });
});
