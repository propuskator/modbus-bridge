// setup default envs from .env.defaults
require('dotenv-defaults/config');

const bridgeConf       = require('./etc/bridge.config');
const { parseSlaveId } = require('./utils/parser');

const Bridge = require('./lib/Bridge');
const { Logger } = require('./lib/utils/Logger');

const logger = Logger('App');

const slaveIds = parseSlaveId(bridgeConf.slaves);

const bridge = new Bridge({ id: bridgeConf.bridgeId, slaveIds, token: bridgeConf.token, serviceToken: bridgeConf.serviceToken });

logger.info('Start');
bridge.init(slaveIds);

bridge.on('error', () => {
    process.exit(1);
});
