module.exports = {
    /** GENERAL */
    MILLISECONDS_IN_SECOND  : 1000,
    MILLISECONDS_IN_MINUTES : 60000,
    BRIDGE_TYPE             : 'modbus',

    /** READER */
    UPDATE_TIME_INTERVAL   : +process.env.UPDATE_TIME_INTERVAL,
    UPDATE_SYNC_INTERVAL   : +process.env.UPDATE_SYNC_INTERVAL,
    UPDATE_LOGS_INTERVAL   : +process.env.UPDATE_LOGS_INTERVAL, // больше чем синк правил, чтобы не ловить блок шины
    UPDATE_POLL_INTERVAL   : +process.env.UPDATE_POLL_INTERVAL,
    SYNC_STATUSES_INTERVAL : +process.env.SYNC_STATUSES_INTERVAL,
    SYNC_OPTIONS_INTERVAL  : +process.env.SYNC_OPTIONS_INTERVAL,
    SYNC_RULES_MAX_BYTES   : +process.env.SYNC_RULES_MAX_BYTES,

    /** MODBUS  */
    MODBUS_OFFLINE_UNITS_DELAY           : +process.env.MODBUS_OFFLINE_UNITS_DELAY,
    MODBUS_ONLINE_UNITS_DELAY            : +process.env.MODBUS_ONLINE_UNITS_DELAY,
    MODBUS_RESET_CONN_INTVL              : +process.env.MODBUS_RESET_CONN_INTVL,
    MODBUS_RETRY_CONN_INTVL              : +process.env.MODBUS_RETRY_CONN_INTVL,
    MODBUS_CONN_TIMEOUT                  : +process.env.MODBUS_CONN_TIMEOUT,
    MODBUS_CALL_RETRIES                  : +process.env.MODBUS_CALL_RETRIES,
    MODBUS_MAX_PARALLEL_CALLS            : +process.env.MODBUS_MAX_PARALLEL_CALLS,
    MODBUS_RETRY_REQUEST_INTERVAL        : +process.env.MODBUS_RETRY_REQUEST_INTERVAL,
    MODBUS_RETRY_REQUEST_COUNT           : +process.env.MODBUS_RETRY_REQUEST_COUNT,
    MODBUS_RETRY_INIT_INTVL              : +process.env.MODBUS_RETRY_INIT_INTVL,
    MODBUS_REQUEST_TIMEOUT               : +process.env.MODBUS_REQUEST_TIMEOUT,
    MODBUS_TRANSPORT_GET_LOGS_TIMEOUT_MS : +process.env.MODBUS_TRANSPORT_GET_LOGS_TIMEOUT_MS,


    MODBUS_REQUEST_LOW_PRIORITY    : 0,
    MODBUS_REQUEST_MEDIUM_PRIORITY : 1,
    MODBUS_REQUEST_HIGH_PRIORITY   : 2,
    MODBUS_REQUEST_URGENT_PRIORITY : 3,

    /* API */
    REST_API_RETRY_INTERVAL : +process.env.REST_API_RETRY_INTERVAL,

    /** READER_VALUES */
    ENUM_TYPES : {
        LOCK_TYPE   : 'LOCK_TYPE',
        K_TYPE      : 'K_TYPE',
        READER_TYPE : 'READER_TYPE'
    },
    LOCK_TYPE : {
        '0' : 'Magnet',
        '1' : 'Latch'
    },
    K_TYPE : {
        '0' : 'NO',
        '1' : 'NC'
    },
    READER_TYPE : {
        '0' : 'Wiegand',
        '1' : '1-Wire'
    }
};
