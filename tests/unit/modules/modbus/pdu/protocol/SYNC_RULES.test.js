const Buff = require('../../../../../../lib/modules/modbus/pdu/Buffer');
const {
    buildRequest,
    parseRequest,
    buildResponse,
    parseResponse
} = require('../../../../../../lib/modules/modbus/pdu/protocol/SYNC_RULES');


jest.setTimeout(30000);


describe('GET_COMM_EVENT_COUNTER tests', () => {
    it('positive: buildRequest', async () => {
        const result = buildRequest(1, 2, Buff.from([ 1, 1, 1, 1 ]));

        expect(result).toEqual(Buff.from([ 0, 4, 1, 2, 0, 1, 1, 1, 1 ]));
    });
    it('positive: buildRequest - empty buffer', async () => {
        const result = buildRequest(0, 0, Buff.from([]));

        expect(result).toEqual(Buff.from([ 0, 0, 0, 0, 0 ]));
    });


    it('positive: parseRequest', async () => {
        const result = parseRequest(Buff.from([ 0, 4, 1, 2, 0, 1, 1, 1, 1 ]));

        expect(result).toEqual({
            index    : 1,
            total    : 2,
            data     : '\x01\x01\x01\x01',
            reserved : 0
        });
    });
    it('positive: parseRequest - empty data', async () => {
        const result = parseRequest(Buff.from([]));

        expect(result).toBe(null);
    });

    it('positive: buildResponse', async () => {
        const result = buildResponse(1, 2, 3);

        expect(result).toEqual(Buff.from([ 0, 3, 1, 2 ]));
    });
    it('positive: buildResponse - empty data', async () => {
        const result = buildResponse();

        expect(result).toEqual(Buff.from([ 0, 0, 0, 0 ]));
    });

    it('positive: parseResponse', async () => {
        const result = parseResponse(Buff.from([ 0, 3, 1, 2 ]));

        expect(result).toEqual({
            index  : 1,
            total  : 2,
            length : 3
        });
    });
    it('positive: parseResponse, buffer.length < 4', async () => {
        const result = parseResponse(Buff.from([]));

        expect(result).toEqual(null);
    });
});
