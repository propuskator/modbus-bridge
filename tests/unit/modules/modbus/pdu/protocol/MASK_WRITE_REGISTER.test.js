const Buff = require('../../../../../../lib/modules/modbus/pdu/Buffer');
const {
    buildRequest,
    parseRequest,
    buildResponse,
    parseResponse
} = require('../../../../../../lib/modules/modbus/pdu/protocol/MASK_WRITE_REGISTER');


jest.setTimeout(30000);


describe('GET_COMM_EVENT_COUNTER tests', () => {
    it('positive: buildRequest', async () => {
        const result = buildRequest(1, Buff.from([ 0, 2 ]), Buff.from([ 0, 3 ]));

        expect(result).toEqual(Buff.from([ 0, 1, 0, 2, 0, 3 ]));
    });
    it('positive: buildRequest - empty buffer', async () => {
        const result = buildRequest();

        expect(result).toEqual(Buff.from([ 0, 0, 0, 0, 0, 0 ]));
    });

    it('positive: parseRequest', async () => {
        const result = parseRequest(Buff.from([ 0, 1, 0, 2, 0, 3 ]));

        expect(result).toEqual({
            address : 1,
            andmask : Buff.from([ 0, 2 ]),
            ormask  : Buff.from([ 0, 3 ])
        });
    });
    it('positive: parseRequest - buffer.length < 6', async () => {
        const result = parseRequest(Buff.from([ 1 ]));

        expect(result).toBe(null);
    });

    it('positive: buildResponse', async () => {
        const result = buildResponse(1, Buff.from([ 0, 2 ]), Buff.from([ 0, 3 ]));

        expect(result).toEqual(Buff.from([ 0, 1, 0, 2, 0, 3 ]));
    });
    it('positive: buildResponse - empty buffer', async () => {
        const result = buildResponse();

        expect(result).toEqual(Buff.from([ 0, 0, 0, 0, 0, 0 ]));
    });

    it('positive: parseResponse', async () => {
        const result = parseResponse(Buff.from([ 0, 1, 0, 2, 0, 3 ]));

        expect(result).toEqual({
            address : 1,
            andmask : Buff.from([ 0, 2 ]),
            ormask  : Buff.from([ 0, 3 ])
        });
    });
    it('positive: parseResponse - buffer.length < 6', async () => {
        const result = parseResponse(Buff.from([ 1 ]));

        expect(result).toBe(null);
    });
});
