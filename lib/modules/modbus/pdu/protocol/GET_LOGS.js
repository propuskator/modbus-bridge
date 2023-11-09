const Helpers = require('./../Helpers');
const Buff    = require('./../Buffer');

exports.code = 0x21;

// extends 0x03 function
exports.buildRequest = Helpers.buildAddressQuantity;
exports.parseRequest = Helpers.parseAddressQuantity;

exports.buildResponse = function (buffer) {
	const header = Buff.alloc(2);

	header.writeUInt16BE(buffer.length, 0);

	return Buffer.concat([ header, buffer ]);
};

exports.parseResponse = function (buffer) {
	const HEADER_BYTES_LEN = 2; // Hi/Lo bytes of packet length (2)

	if (buffer.length < HEADER_BYTES_LEN) return null;

	const length = buffer.readUInt16BE(0);

	if (buffer.length < length + HEADER_BYTES_LEN) return null;

	const data = buffer.toString('utf8', HEADER_BYTES_LEN, length + HEADER_BYTES_LEN);

	return {
		length,
		data
	};
};
