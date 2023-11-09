module.exports = {
    url    : process.env.API_URL,
    routes : {
        reader : {
            TIME      : '/api/v2/token-reader/time',
            SYNC      : '/api/v1/token-reader/access-tokens/sync',
            POST_LOGS : '/api/v1/token-reader/access-logs'
        },
        api : {
            CREATE_JWT_TOKEN   : '/api/v1/services-api/login',
            READER_BULK_CREATE : '/api/v1/services-api/access-token-readers/bulk-create'
        }
    }
};
