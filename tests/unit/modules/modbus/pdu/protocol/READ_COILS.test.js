const Buff = require('../../../../../../lib/modules/modbus/pdu/Buffer');
const {
    buildRequest,
    parseRequest,
    buildResponse,
    parseResponse
} = require('../../../../../../lib/modules/modbus/pdu/protocol/READ_COILS');


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
        const result = buildResponse([ 1, 1, 1, 1, 0, 0, 0, 0 ]);

        expect(result).toEqual(Buff.from([ 1, 15 ]));
    });
    it('negative: buildResponse - empty data', async () => {
        function options() {
            buildResponse();
        }

        expect(options).toThrowError(Error('Buffer overflow, bit length is out of bounds'));
    });

    it('positive: parseResponse', async () => {
        const result = parseResponse(Buff.from([ 1, 15 ]));

        expect(result).toEqual([ 1, 1, 1, 1, 0, 0, 0, 0 ]);
    });
    it('positive: parseResponse, buffer.length < 6', async () => {
        const result = parseResponse(Buff.from([]));

        expect(result).toEqual([]);
    });
});
