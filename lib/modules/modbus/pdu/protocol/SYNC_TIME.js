const helpers = require('./../Helpers');

exports.code = 0x23;

exports.buildRequest = helpers.customRequestBuilder;
exports.parseRequest = helpers.customRequestParser;

exports.buildResponse = helpers.customResponseBuilder;
exports.parseResponse = helpers.customResponseParser;
