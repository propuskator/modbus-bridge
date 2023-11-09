const Serial = require('./serial');
const TCP = require('./tcp');
const UDP = require('./udp');

module.exports = {
    tcp    : TCP,
    upd    : UDP,
    serial : Serial
};
