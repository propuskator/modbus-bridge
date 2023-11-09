const { parseSlaveId, parseRules } = require('../../../utils/parser');

jest.setTimeout(30000);

describe('parseSlaveId tests', () => {
    it('positive: correct data', async () => {
        const arr = [ 1, 2, 3, 4, 5, 10, 11, 12 ];
        const result = parseSlaveId('1-5;10-12');

        expect(result).toEqual(expect.arrayContaining(arr));
    });

    it('positive: incorrect data', async () => {
        const result = parseSlaveId('1-5,10-12');

        expect(result).toEqual(expect.arrayContaining([]));
    });
});

describe('parseRules tests', () => {
    it('positive: correct data', async () => {
        const result = parseRules('27215367%sbj-JSNXEHQZFIVD%\nsbj-JSNXEHQZFIVD_/3_480_1200_1111100\n');

        expect(result).toEqual(expect.objectContaining({ syncTimestamp: 27215367 }));
    });

    it('positive: incorrect data', async () => {
        const result = parseRules('incorrect-data');

        expect(result).toEqual(expect.objectContaining({ syncTimestamp: 0 }));
    });
});
