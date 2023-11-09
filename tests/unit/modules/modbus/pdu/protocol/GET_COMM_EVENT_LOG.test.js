const Buff = require('../../../../../../lib/modules/modbus/pdu/Buffer');
const {
    buildRequest,
    parseRequest,
    buildResponse,
    parseResponse
} = require('../../../../../../lib/modules/modbus/pdu/protocol/GET_COMM_EVENT_LOG');


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
        const result = buildResponse(1, 2, 3, Buff.from([ 4, 5 ]));

        expect(result).toEqual(Buff.from([ 8, 0, 1, 0, 2, 0, 3, 4, 5 ]));
    });
    it('positive: buildResponse - empty buffer', async () => {
        const result = buildResponse(1, 2, 3, Buff.from([]));

        expect(result).toEqual(Buff.from([ 6, 0, 1, 0, 2, 0, 3 ]));
    });

    it('positive: parseResponse', async () => {
        const result = parseResponse(Buff.from([ 8, 0, 1, 0, 2, 0, 3, 4, 5 ]));

        expect(result).toEqual({
            status        : 1,
            event_count   : 2,
            message_count : 3,
            events        : Buff.from([ 4, 5 ])
        });
    });
    it('positive: buffer.length < 7', async () => {
        const result = parseResponse(Buff.from([ 1 ]));

        expect(result).toBe(null);
    });
});
