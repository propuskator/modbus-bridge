const TcpTransport = require('../../../../../lib/modules/modbus/transports/tcp');

jest.mock('../../../../../lib/modules/modbus/transports/base');

const transport = new TcpTransport({});

jest.setTimeout(30000);


describe('TcpTransport', () => {
    it('positive: wrap', async () => {
        const result = transport.wrap(Buffer.from([ 1, 2, 3, 4 ]), {
            unitId        : 1,
            transactionId : 1
        });

        expect(result).toEqual({
            buffer : Buffer.from([ 0, 1, 0, 0, 0, 5, 1, 1, 2, 3, 4 ]),
            key    : '1:0:1:1'
        });
    });
    it('positive: wrap - without transactionId', async () => {
        const result = transport.wrap(Buffer.from([ 1, 2, 3, 4 ]), {
            unitId : 1
        });

        expect(result).toEqual({
            buffer : Buffer.from([ 0, 0, 0, 0, 0, 5, 1, 1, 2, 3, 4 ]),
            key    : '0:0:1:1'
        });
    });
    it('negative: wrap - only pdu', async () => {
        function options() {
            transport.wrap(Buffer.from([ 1, 2, 3, 4 ]));
        }

        expect(options).toThrowError(Error('Cannot wrap pdu with undefined unitId(undefined)'));
    });
    it('negative: wrap - empty data', async () => {
        function options() {
            transport.wrap();
        }

        expect(options).toThrowError(Error('Cannot wrap pdu with undefined unitId(undefined)'));
    });

    it('positive: unwrap', async () => {
        const result = transport.unwrap(Buffer.from([ 0, 0, 0, 0, 0, 5, 1, 1, 2, 3, 4 ]));

        expect(result).toEqual({
            key    : '0:0:1:1',
            length : 11,
            extra  : {
                transactionId : 0,
                unitId        : 1
            },
            pdu : Buffer.from([ 1, 2, 3, 4 ])
        });
    });
    it('positive: unwrap - buffer.length < 6', async () => {
        const result = transport.unwrap(Buffer.from([]));

        expect(result).toBe(null);
    });
    it('positive: unwrap - buffer.length < length', async () => {
        const result = transport.unwrap(Buffer.from([ 0, 0, 0, 0, 0, 12, 1, 1, 2, 3, 4 ]));

        expect(result).toBe(null);
    });
});
