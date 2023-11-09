class Modbus {
    constructor(slaveId) {
        this.slaveId = slaveId;
        this.token = 'token';
        this.rules = '27222511%sbj-JSNXEHQZFIVD%\nsbj-JSNXEHQZFIVD_/3_480_1200_1111100\n';
        this.logs = 'Logs from controller';
        this.data = {
            '0'  : 0x00,
            '1'  : 0x01,
            '2'  : 0x02,
            '3'  : 0x03,
            '4'  : 0x04,
            '32' : 0,
            '33' : 5,
            '34' : 1,
            '35' : 1,
            '36' : 1,
            '37' : 1,
            '38' : 1,
            '39' : 1,
            '40' : 1,
            '41' : 1,
            '42' : 1,
            '43' : 1
        };
    }

    async request(fname, extra, ...args) {
        if (this.slaveId === extra.unitId) {
            let result;
            const data = [];

            // eslint-disable-next-line default-case
            switch (fname) {
                case 'ReadHoldingRegisters':
                    for (let i = args[0]; i < args[0] + args[1]; i++) {
                        data.push(Buffer.from([ 0, this.data[i] ]));
                    }

                    result = { data };
                    break;

                case 'WriteSingleRegister':
                    this.data[args[0]] = args[1].readUInt16BE(0);
                    result = { value: Buffer.from([ 0, this.data[args[0]] ]) };

                    if (args[0] === 0x10 && args[1].readUInt16BE() === 1) {
                        this.logs = '';
                    }

                    break;

                case 'OpenByToken':
                    if (args[1].toString() === this.token) {
                        result = { data: 1 };
                    } else {
                        result = { data: 0 };
                    }

                    break;

                case 'SyncRules':
                    result = await this.syncRules(args[2]);
                    break;

                case 'GetLogs':
                    result = { data: this.logs };
            }

            return result;
        }

        throw Error('Request timed out');
    }

    async syncRules(data) {
        this.data['0'] = 1;
        await new Promise((resolve) => setTimeout(() => {
            this.data['0'] = 0;
            resolve();
        }, 2000));

        return data.toString('utf8') === this.rules;
    }
}

module.exports = Modbus;
