const Events = require('events');

/*
class
    methods
        write(buffer)
    events
        data - emits when new data is received, parameters for callback - buffer and optionally meta data
*/
class Connection extends Events {
    /*
        options - object
            .port = 502
            .port = 'localhost'
    */
    write() {
        throw new Error('I\'m abstract');
    }
}
/*
class
    methods
        write(buffer)
    events
        connection emits when new connection is received
        connection:data - emits when new data is received, parameters for callback - buffer
        connection:close
        connection:error
*/
class Server extends Events {
    /*
        options - object
            .port = 502
            .port = 'localhost'
    */
    write() {
        throw new Error('I\'m abstract');
    }
}
module.exports.Connection = Connection;
module.exports.Server = Server;
