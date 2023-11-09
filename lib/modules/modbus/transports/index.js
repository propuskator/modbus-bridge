const ASCII = require('./ascii');
const Serial = require('./serial');
const TCP = require('./tcp');

module.exports = {
    tcp    : TCP,
    ascii  : ASCII,
    serial : Serial
};
