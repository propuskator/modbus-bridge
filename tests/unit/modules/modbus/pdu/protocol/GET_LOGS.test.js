const Buff = require('../../../../../../lib/modules/modbus/pdu/Buffer');
const {
    buildRequest,
    parseRequest,
    buildResponse,
    parseResponse
} = require('../../../../../../lib/modules/modbus/pdu/protocol/GET_LOGS');


jest.setTimeout(30000);


describe('GET_COMM_EVENT_COUNTER tests', () => {
    it('positive: buildRequest', async () => {
        const result = buildRequest(1, 2);

        expect(result).toEqual(Buff.from([ 0, 1, 0, 2 ]));
    });
    it('positive: buildRequest - empty data', async () => {
        const result = buildRequest();

        expect(result).toEqual(Buff.from([ 0, 0, 0, 0 ]));
    });


    it('positive: parseRequest', async () => {
        const result = parseRequest(Buff.from([ 0, 1, 0, 2 ]));

        expect(result).toEqual({
            address  : 1,
            quantity : 2
        });
    });
    it('positive: parseRequest - empty data', async () => {
        const result = parseRequest(Buff.from([]));

        expect(result).toBe(null);
    });

    it('positive: buildResponse', async () => {
        const result = buildResponse(Buff.from([ 1, 2, 3, 4 ]));

        expect(result).toEqual(Buff.from([ 0, 4, 1, 2, 3, 4 ]));
    });
    it('positive: buildResponse - empty buffer', async () => {
        const result = buildResponse(Buff.from([]));

        expect(result).toEqual(Buff.from([ 0, 0 ]));
    });

    it('positive: parseResponse', async () => {
        const result = parseResponse(Buff.from([ 0, 4, 1, 2, 3, 4 ]));

        expect(result).toEqual({
            length : 4,
            data   : '\x01\x02\x03\x04'
        });
    });
    it('positive: buffer.length < 2', async () => {
        const result = parseResponse(Buff.from([ 1 ]));

        expect(result).toBe(null);
    });
});
