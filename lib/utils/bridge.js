function createReqBody(bridgeId, slaveIds = []) {
    return {
        data : slaveIds.map(slaveId => {
            return {
                name : getReaderName(bridgeId, slaveId),
                code : getReaderCode(bridgeId, slaveId)
            };
        })
    };
}

function getReaderName(bridgeId, slaveId) {
    return `[${bridgeId}] Modbus reader ${slaveId}`;
}

function getReaderCode(bridgeId, slaveId) {
    return `${bridgeId}-${slaveId}`;
}

module.exports = {
    createReqBody,
    getReaderName,
    getReaderCode
};
