const BaseTransport = require('./base');

class SerialTransport extends BaseTransport {
    constructor({ ... options }) {
        super(options);
    }

    wrap(pdu, { unitId, crc = true } = {}) {
        // unitId cannot be 0, null, undefined, '' etc
        if (!unitId) throw new Error(`Cannot wrap pdu with undefined unitId(${unitId})`);

        const fcode = pdu.readUInt8(0);
        const key = [ unitId, fcode ].join(':');

        const prepdu = Buffer.from([ unitId ]);
        const postpdu = Buffer.alloc(crc ? 2 : 0);

        if (crc) postpdu.writeUInt16LE(crc16(Buffer.concat([ prepdu, pdu ])));

        return {
            buffer : Buffer.concat([ prepdu, pdu, postpdu ]),
            key
        };
    }

    unwrap(buffer) {
        if (buffer.length <= 3) return null;

        const length = buffer.length;
        const unitId = buffer.readUInt8(0);
        const received_crc = buffer.readUInt16LE(length - 2);
        const expected_crc = crc16(buffer.slice(0, length - 2));

        if (received_crc !== expected_crc) return null;

        const fcode = buffer.readUInt8(1);
        const key = [ unitId, fcode ].join(':');

        return {
            key,
            length,
            extra : {
                unitId
            },
            pdu : buffer.slice(1, length - 2)
        };
    }
}

function crc16(buffer) {
    let crc = 0xFFFF;

    // eslint-disable-next-line more/no-c-like-loops
    for (let i = 0; i < buffer.length; i++) {
        crc ^= buffer[i];

        for (let j = 8; j !== 0; j--) {
            if ((crc & 0x0001) !== 0) {
                crc >>= 1;
                crc ^= 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }

    return crc;
}

module.exports = SerialTransport;
