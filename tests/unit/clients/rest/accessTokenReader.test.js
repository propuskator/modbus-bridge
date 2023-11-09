jest.setTimeout(30000);
jest.mock('../../../../lib/api/index');

const ApiClient = require('../../../../lib/api/index');
const AccessTokenReader = require('../../../../lib/clients/rest/index');

const tokenReader = new AccessTokenReader({
    token     : 'accessToken',
    code      : 'code',
    apiClient : new ApiClient()
});

const wrongTokenReader = new AccessTokenReader({
    token     : 'wrongAccessToken',
    code      : 'wrongCode',
    apiClient : new ApiClient()
});

const error = new Error('Access forbidden');

describe('AccessTokenReader tests', () => {
    describe('getTime()', () => {
        test('positive: GET timestamp', async () => {
            const result = await tokenReader.getTime();

            expect(result).toBe('27213933,EET-2EEST,M3.4.0/3,M10.5.0/4,1632835995');
        });

        test('negative: GET timestamp, wrong headers', async () => {
            async function options() {
                await wrongTokenReader.getTime();
            }

            await expect(options).rejects.toThrowError(error);
        });
    });

    describe('syncRules()', () => {
        test('positive: POST, sync rules', async () => {
            const result = await tokenReader.syncRules(27214081);

            expect(result).toBe('27214081%%');
        });

        test('negative: POST, sync rules, wrong headers', async () => {
            async function options() {
                await wrongTokenReader.syncRules(27214081);
            }

            await expect(options).rejects.toThrowError(error);
        });
    });

    describe('postLogs()', () => {
        test('positive: POST, send logs', async () => {
            const result = await tokenReader.postLogs('1632844897_B15077_1');

            expect(result).toBe('ok,1');
        });

        test('negative: POST, send logs, wrong headers', async () => {
            async function options() {
                await wrongTokenReader.postLogs('1632844897_B15077_1');
            }

            await expect(options).rejects.toThrowError(error);
        });
    });
});
