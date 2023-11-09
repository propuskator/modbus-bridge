const { routes: { reader } } = require('./../../../etc/rest-api.config');

class AccessTokenReader {
    constructor({ token, code, apiClient }) {
        this.token = token;
        this.code = code;

        this.apiClient = apiClient;
    }

    async getTime() {
        return this.apiClient.get(reader.TIME, {}, this._getHeaders(), 'text');
    }

    async syncRules(lastSyncTime = 0) {
        return this.apiClient.post(reader.SYNC, lastSyncTime, this._getHeaders(), 'text');
    }

    async postLogs(logs) {
        return this.apiClient.post(reader.POST_LOGS, logs, this._getHeaders(), 'text');
    }

    _getHeaders() {
        return {
            'X-AuthToken'  : this.token,
            'X-AuthReader' : this.code
        };
    }
}

module.exports = AccessTokenReader;
