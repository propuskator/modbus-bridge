const { stringify } = require('query-string');
const fetch = require('node-fetch');
const { Logger } = require('./../utils/Logger');


class ApiClient {
    constructor({ apiUrl = '' }) {
        this.apiUrl = apiUrl;
        this.log = Logger('ApiClient');
    }

    async get(url, params, headers = {}, mode = 'json') {
        return this.request({
            url,
            params,
            method : 'GET',
            headers,
            mode
        });
    }

    async post(url, payload = {}, headers = {}, mode = 'json') {
        return this.request({
            url,
            method : 'POST',
            body   : payload,
            headers,
            mode
        });
    }

    async put(url, payload = {}, headers = {}, mode = 'json') {
        return this.request({
            url,
            method : 'PUT',
            body   : payload,
            headers,
            mode
        });
    }

    async patch(url, payload = {}, headers = {}, mode = 'json') {
        return this.request({
            url,
            method : 'PATCH',
            body   : payload,
            headers,
            mode
        });
    }

    async delete(url, payload = {}, headers = {}, mode = 'json') {
        return this.request({
            url,
            method : 'DELETE',
            body   : payload,
            headers,
            mode
        });
    }

    createOptions(method, body, headers, mode) {
        const options = {
            method,
            headers : {
                'Cache-Control'                : 'no-cache',
                'pragma'                       : 'no-cache',
                'Access-Control-Allow-Headers' : 'x-authtoken',
                ...headers
            }
        };

        switch (mode) {
            case 'text':
                if (body && (typeof body !== 'string' && typeof body !== 'number')) {
                    throw new Error('Invalid data type!');
                }

                options.headers['Content-Type'] = 'text/plain';
                options.body = method !== 'GET' ? body : undefined;
                break;
            case 'formData':
                if (body && !(body instanceof FormData)) {
                    throw new Error('Invalid data type!');
                }

                options.headers['Content-Type'] = 'multipart/form-data';
                options.body = method !== 'GET' ? body : undefined;
                break;
            case 'json':
                if (body && typeof body !== 'object') {
                    throw new Error('Invalid data type!');
                }

                options.headers['Content-Type'] = 'application/json';
                options.body = method !== 'GET' ? JSON.stringify(body) : undefined;
                break;
            default:
                break;
        }

        return options;
    }

    request = async ({ url, method, params = {}, body, headers = {}, mode = 'json' }) => {
        try {
            const options = this.createOptions(method, body, headers, mode);
            const query = Object.keys(params).length ? `?${stringify(params)}` : '';
            const response = await fetch(`${this.apiUrl}${url}${query}`, { ...options });

            if (response.status !== 200) {
                const content = await response.json();

                throw Error(content.message);
            }

            let content;

            switch (mode) {
                case 'text':
                    content = await response.text();
                    break;
                case 'formData':
                    content = await response.blob();
                    break;
                default:
                    content = await response.json();
                    break;
            }

            return content;
        } catch (error) {
            this.log.error(error);

            throw error;
        }
    }
}

module.exports = ApiClient;
