const BaseTransport = require('./base');

const MESSAGE_START = Buffer.from([ 0x3A ]);
const MESSAGE_END   = Buffer.from([ 0x0D, 0x0A ]);

class AsciiTransport extends BaseTransport {
    constructor({ ... options }) {
        super(options);
    }

    wrap(pdu, { unitId } = {}) {
        // unitId cannot be 0, null, undefined, '' etc
        if (!unitId) throw new Error(`Cannot wrap pdu with undefined unitId(${unitId})`);

        const fcode = pdu.readUInt8(0);
        const key = [ unitId, fcode ].join(':');

        const buffer = Buffer.alloc((pdu.length + 1) * 2 + 2 + MESSAGE_START.length + MESSAGE_END.length);

        MESSAGE_START.copy(buffer, 0);
        MESSAGE_END.copy(buffer, buffer.length - MESSAGE_END.length);

        writeAscii(buffer, Buffer.from([ unitId ]), MESSAGE_START.length);
        writeAscii(buffer, pdu, MESSAGE_START.length + 2);
        writeAscii(buffer, lrc(Buffer.concat([ Buffer.from([ unitId ]), pdu ])), buffer.length - MESSAGE_END.length - 2);

        return {
            buffer,
            key
        };
    }

    unwrap(buffer) {
        if (buffer.length < MESSAGE_START.length + MESSAGE_END.length + 3) return null;

        if (Buffer.compare(buffer.slice(0, MESSAGE_START.length), MESSAGE_START)) return null;

        const end = buffer.indexOf(MESSAGE_END, MESSAGE_START.length);

        if (end === -1) return null;

        const length = end + MESSAGE_END.length;

        const temp      = Buffer.from(buffer.slice(MESSAGE_START.length, end).toString(), 'hex');

        const unitId = temp.readUInt8(0);
        const receiver_lrc = temp.readUInt8(temp.length - 1);
        const expected_crc = lrc(temp.slice(0, temp.length - 1)).readUInt8(0);

        if (receiver_lrc !== expected_crc) return null;

        const fcode = buffer.readUInt8(1);
        const key = [ unitId, fcode ].join(':');

        return {
            key,
            length,
            extra : {
                unitId
            },
            pdu : temp.slice(1, temp.length - 1)
        };
    }
}

function writeAscii(buffer, block, offset) {
    for (let i = 0; i < block.length; i++) {
        let char = block[i].toString(16).toUpperCase();

        if (char.length < 2) char = `0${  char}`;

        buffer.writeUInt8(char.charCodeAt(0), offset + (i * 2));
        buffer.writeUInt8(char.charCodeAt(1), offset + (i * 2) + 1);
    }
}

function lrc(data) {
    let _lrc = 0;

    for (let i = 0; i < data.length; i++) _lrc += data[i];

    return Buffer.from([ (0xFF - _lrc + 1) ]);
}

module.exports = AsciiTransport;
