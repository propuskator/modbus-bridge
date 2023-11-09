const TcpTransport = require('../../../../../lib/modules/modbus/transports/serial');

jest.mock('../../../../../lib/modules/modbus/transports/base');

const transport = new TcpTransport({});

jest.setTimeout(30000);


describe('TcpTransport', () => {
    it('positive: wrap', async () => {
        const result = transport.wrap(Buffer.from([ 1, 2, 3, 4 ]), { unitId: 1 });

        expect(result).toEqual({
            buffer : Buffer.from([ 1, 1, 2, 3, 4, 0xb8, 0xcf ]),
            key    : '1:1'
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
        const result = transport.unwrap(Buffer.from([ 1, 1, 2, 3, 4, 0xb8, 0xcf ]));

        expect(result).toEqual({
            key    : '1:1',
            length : 7,
            extra  : {
                unitId : 1
            },
            pdu : Buffer.from([ 1, 2, 3, 4 ])
        });
    });
    it('positive: unwrap - buffer.length <= 3', async () => {
        const result = transport.unwrap(Buffer.from([]));

        expect(result).toBe(null);
    });
    it('positive: unwrap - wrong crc', async () => {
        const result = transport.unwrap(Buffer.from([ 1, 1, 2, 3, 4, 0, 0 ]));

        expect(result).toBe(null);
    });
});
