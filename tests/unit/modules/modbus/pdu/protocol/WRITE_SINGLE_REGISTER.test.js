const Buff = require('../../../../../../lib/modules/modbus/pdu/Buffer');
const {
    buildRequest,
    parseRequest,
    buildResponse,
    parseResponse
} = require('../../../../../../lib/modules/modbus/pdu/protocol/WRITE_SINGLE_REGISTER');


jest.setTimeout(30000);


describe('GET_COMM_EVENT_COUNTER tests', () => {
    it('positive: buildRequest', async () => {
        const result = buildRequest(5, Buff.from([ 255, 255 ]));

        expect(result).toEqual(Buff.from([ 0, 5, 255, 255 ]));
    });
    it('positive: buildRequest - empty buffer', async () => {
        const result = buildRequest(0, Buff.from([]));

        expect(result).toEqual(Buff.from([ 0, 0, 0, 0 ]));
    });


    it('positive: parseRequest', async () => {
        const result = parseRequest(Buff.from([ 0, 5, 255, 255 ]));

        expect(result).toEqual({
            address : 5,
            value   : Buff.from([ 255, 255 ])
        });
    });
    it('positive: parseRequest - empty buffer', async () => {
        const result = parseRequest(Buff.from([]));

        expect(result).toBe(null);
    });

    it('positive: buildResponse', async () => {
        const result = buildResponse(5, Buff.from([ 255, 255 ]));

        expect(result).toEqual(Buff.from([ 0, 5, 255, 255 ]));
    });
    it('positive: buildResponse - empty data', async () => {
        const result = buildResponse(0, Buff.from([]));

        expect(result).toEqual(Buff.from([ 0, 0, 0, 0 ]));
    });

    it('positive: parseResponse', async () => {
        const result = parseResponse(Buff.from([ 0, 5, 255, 255 ]));

        expect(result).toEqual({
            address : 5,
            value   : Buff.from([ 255, 255 ])
        });
    });
    it('positive: parseResponse, buffer.length < 4', async () => {
        const result = parseResponse(Buff.from([]));

        expect(result).toBe(null);
    });
});
