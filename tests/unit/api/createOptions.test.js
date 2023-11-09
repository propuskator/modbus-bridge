const ApiClient = require('../../../lib/api/index');

const api = new ApiClient({});
const createOptions = api.createOptions;

const error = new Error('Invalid data type!');

jest.setTimeout(30000);

describe('API, create options:', () => {
    test('POSITIVE: create options, type text, GET request', async () => {
        const options = createOptions('GET', 'body', {}, 'text');

        expect(options.headers['Content-Type']).toBe('text/plain');
        expect(options.body).toBe(undefined);
    });

    test('POSITIVE: create options, type text, POST request', async () => {
        const options = createOptions('POST', 'body', {}, 'text');

        expect(options.headers['Content-Type']).toBe('text/plain');
        expect(options.body).toBe('body');
    });

    test('POSITIVE: create options, type JSON, POST request', async () => {
        const options = createOptions('POST', { body: 'text' }, {}, 'json');

        expect(options.headers['Content-Type']).toBe('application/json');
        expect(options.body).toBe('{"body":"text"}');
    });

    test('POSITIVE: create options, type FormData, POST request', async () => {
        const formData = new FormData();

        formData.append('data', 'text');
        const options = createOptions('POST', formData, {}, 'formData');

        expect(options.headers['Content-Type']).toBe('multipart/form-data');
        expect(options.body.get('data')).toBe('text');
    });


    test('NEGATIVE: create options, type FormData, wrong body, POST request', async () => {
        function options() {
            createOptions('POST', 'wrong data', {}, 'formData');
        }

        expect(options).toThrowError(error);
    });


    test('NEGATIVE: create options, type JSON, wrong body, POST request', async () => {
        function options() {
            createOptions('POST', 'wrong data', {}, 'json');
        }

        expect(options).toThrowError(error);
    });

    test('NEGATIVE: create options, type text, wrong body, POST request', async () => {
        function options() {
            createOptions('POST', {}, {}, 'text');
        }

        expect(options).toThrowError(error);
    });
});
