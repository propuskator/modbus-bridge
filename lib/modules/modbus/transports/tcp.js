const BaseTransport = require('./base');

class TcpTransport extends BaseTransport {
    constructor({ transactionId, ...options }) {
        super(options);

        this.transactionId = transactionId || -1;
        this.protocol = 0; // unknown option
    }

    wrap(pdu, { unitId, transactionId = this.transactionId = ++this.transactionId & 0xffff } = {}) {
        // unitId cannot be 0, null, undefined, '' etc
        if (!unitId) throw new Error(`Cannot wrap pdu with undefined unitId(${unitId})`);

        const fcode = pdu.readUInt8(0);
        const key = [ transactionId, this.protocol, unitId, fcode ].join(':');
        const header = Buffer.alloc(7);

        header.writeUInt16BE(transactionId, 0);
        header.writeUInt16BE(this.protocol, 2);
        header.writeUInt16BE(pdu.length + 1, 4);
        header.writeUInt8(unitId, 6);

        return {
            buffer : Buffer.concat([ header, pdu ]),
            key
        };
    }

    unwrap(buffer) {
        // not enough data to see package length
        if (buffer.length < 6) return null;

        const transactionId = buffer.readUInt16BE(0);
        const protocol = buffer.readUInt16BE(2);
        const length = buffer.readUInt16BE(4) + 6;

        if (buffer.length < length) return null;

        const unitId = buffer.readUInt8(6);
        const fcode = buffer.readUInt8(7);

        const key = [ transactionId, protocol, unitId, fcode ].join(':');

        return {
            key,
            length,
            extra : {
                transactionId,
                unitId
            },
            pdu : buffer.slice(7, length)
        };
    }
}

module.exports = TcpTransport;
