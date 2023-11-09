var Helpers = require("../Helpers");
var Buff    = require("../Buffer");

exports.code = 0x24;

exports.buildRequest = function (address, buffer) {
    var header = Buff.alloc(5);

    header.writeUInt16BE(address, 0);
    header.writeUInt16BE(1, 2); // write long payload to one register
    header.writeUInt8(buffer.length, 4);

    return Buffer.concat([ header, buffer ]);
};
exports.parseRequest = function (buffer) {
    if (buffer.length < 5) return null;

    var data = {
        address  : buffer.readUInt16BE(0),
        quantity : buffer.readUInt16BE(2),
        value    : buffer.slice(5, buffer.length)
    };

    return data;
};

exports.buildResponse = Helpers.buildAddressQuantity;
exports.parseResponse = function (buffer) {
    if (buffer.length < 6) return null;

	return {
		address  : buffer.readUInt16BE(0),
		quantity : buffer.readUInt16BE(2),
		data     : buffer.readUInt16BE(4),

	};
};
