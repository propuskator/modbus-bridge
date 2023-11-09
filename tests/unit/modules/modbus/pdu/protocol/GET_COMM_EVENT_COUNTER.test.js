const Buff = require('../../../../../../lib/modules/modbus/pdu/Buffer');
const {
    buildRequest,
    parseRequest,
    buildResponse,
    parseResponse
} = require('../../../../../../lib/modules/modbus/pdu/protocol/GET_COMM_EVENT_COUNTER');


jest.setTimeout(30000);


describe('GET_COMM_EVENT_COUNTER tests', () => {
    it('positive: buildRequest', async () => {
        const result = buildRequest();

        expect(result).toEqual(Buffer.alloc(0));
    });

    it('positive: parseRequest', async () => {
        const result = parseRequest();

        expect(result).toEqual({});
    });

    it('positive: buildResponse', async () => {
        const result = buildResponse(1, 2);

        expect(result).toEqual(Buff.from([ 1, 2 ]));
    });
    it('positive: buildResponse - empty data', async () => {
        const result = buildResponse();

        expect(result).toEqual(Buff.from([ 0, 0 ]));
    });

    it('positive: parseResponse', async () => {
        const result = parseResponse(Buff.from([ 1, 2 ]));

        expect(result).toEqual({ status: 1, event_count: 2 });
    });
    it('positive: buffer.length > 2', async () => {
        const result = parseResponse(Buff.from([ 1, 2, 3, 4 ]));

        expect(result).toEqual({ status: 1, event_count: 2 });
    });
    it('positive: buffer.length < 2', async () => {
        const result = parseResponse(Buff.from([ 1 ]));

        expect(result).toBe(null);
    });
});
