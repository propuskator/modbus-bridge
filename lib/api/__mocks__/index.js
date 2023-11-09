class ApiClient {
    async get(url, params, headers = {}) {
        if (headers['X-AuthToken'] === 'accessToken' && headers['X-AuthReader'] === 'code') {
            return '27213933,EET-2EEST,M3.4.0/3,M10.5.0/4,1632835995';
        }

        throw Error('Access forbidden');
    }

    async post(url, payload = {}, headers = {}) {
        if (headers['X-AuthToken'] === 'accessToken' && headers['X-AuthReader'] === 'code') {
            if (url === '/api/v1/token-reader/access-tokens/sync') {
                return `${payload}%%`;
            }

            if (url === '/api/v1/token-reader/access-logs') {
                return 'ok,1';
            }
        }

        throw Error('Access forbidden');
    }
}

module.exports = ApiClient;
