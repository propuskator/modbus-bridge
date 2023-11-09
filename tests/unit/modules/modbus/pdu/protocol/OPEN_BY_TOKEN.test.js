const Buff = require('../../../../../../lib/modules/modbus/pdu/Buffer');
const {
    buildRequest,
    parseRequest,
    buildResponse,
    parseResponse
} = require('../../../../../../lib/modules/modbus/pdu/protocol/OPEN_BY_TOKEN');


jest.setTimeout(30000);


describe('GET_COMM_EVENT_COUNTER tests', () => {
    it('positive: buildRequest', async () => {
        const textBuff = Buff.from('text', 'utf8');
        const result = buildRequest(11, textBuff);

        expect(result).toEqual(Buffer.concat([ Buff.from([ 0, 11, 0, 1, textBuff.length ]), textBuff ]));
    });
    it('positive: buildRequest - empty buffer', async () => {
        const result = buildRequest(0, Buff.from([]));

        expect(result).toEqual(Buff.from([ 0, 0, 0, 1, 0 ]));
    });

    it('positive: parseRequest', async () => {
        const textBuff = Buff.from('text', 'utf8');
        const result = parseRequest(Buffer.concat([ Buff.from([ 0, 11, 0, 1, textBuff.length ]), textBuff ]));

        expect(result).toEqual({
            address  : 11,
            quantity : 1,
            value    : textBuff
        });
    });
    it('positive: parseRequest, buffer.length < 5', async () => {
        const result = parseRequest(Buff.from([ 1 ]));

        expect(result).toBe(null);
    });

    it('positive: buildResponse', async () => {
        const result = buildResponse(1, 2);

        expect(result).toEqual(Buff.from([ 0, 1, 0, 2 ]));
    });
    it('positive: buildResponse - empty data', async () => {
        const result = buildResponse();

        expect(result).toEqual(Buff.from([ 0, 0, 0, 0 ]));
    });

    it('positive: parseResponse', async () => {
        const result = parseResponse(Buff.from([ 0, 11, 0, 1, 0, 0 ]));

        expect(result).toEqual({
            address  : 11,
            quantity : 1,
            data     : 0
        });
    });
    it('positive: parseResponse, buffer.length < 6', async () => {
        const result = parseResponse(Buff.from([ 1 ]));

        expect(result).toBe(null);
    });
});
