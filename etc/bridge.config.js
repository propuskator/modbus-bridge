module.exports = {
    /**
     * Supported formats:
     * Range: 1-10
     * Enumerated: 1;2;3;4
     * Combined: 1;2;5-10;15
    */
    slaves       : process.env.SLAVE_IDS,
    bridgeId     : process.env.BRIDGE_ID,
    token        : process.env.TOKEN,
    serviceToken : process.env.SERVICE_TOKEN,
    workspace    : {
        name  : process.env.WORKSPACE_NAME,
        login : process.env.WORKSPACE_LOGIN
    },
    mqtt : {
        uri      : process.env.MQTT_URI,
        username : process.env.MQTT_USER,
        password : process.env.MQTT_PASS
    },
    modbus : {
        driver : {
            type       : process.env.MODBUS_DRIVER_TYPE,
            connection : {
                tcp : {
                    port : process.env.MODBUS_DRIVER_TCP_PORT,
                    host : process.env.MODBUS_DRIVER_TCP_HOST
                },
                serial : {
                    baudRate : +process.env.MODBUS_BAUD_RATE,
                    dataBits : +process.env.MODBUS_DATA_BITS,
                    stopBits : +process.env.MODBUS_STOP_BITS,
                    parity   : process.env.MODBUS_PARITY,
                    path     : process.env.MODBUS_DRIVER_SERIAL_PORT
                }
            }
        },
        transport : {
            type    : process.env.MODBUS_TRANSPORT_TYPE,
            options : {
                drainTimeout   : +process.env.MODBUS_TRANSPORT_DRAIN_TIMEOUT_MS,
                requestTimeout : +process.env.MODBUS_TRANSPORT_REQUEST_TIMEOUT_MS
            }
        }
    }
};
