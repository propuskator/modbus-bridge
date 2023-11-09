const { flatten, uniq } = require('lodash');

function parseSlaveId(value, delimeter = ';') {
    const split = value.split(delimeter);

    const list = split.map(val => {
        const range = val.split('-'); // Example: 1-10

        if (range.length === 1) return +range[0]; // Single id

        const rangeArr = [];

        // add each id to arr from range
        // eslint-disable-next-line more/no-c-like-loops
        for (let idx = +range[0]; idx <= range[1]; idx++) rangeArr.push(idx);

        return rangeArr;
    });

    // combine arrays into single one (example, [ 1, 2, [3, 4] ] => [ 1, 2, 3, 4 ])
    // return only unique ids
    return uniq(flatten(list));
}

function parseRules(rules) {
    /**
     * lines:
     * <last_sync_timestamp_in_minutes>%<rules_to_del>%\n
     * <rule_to_save_1>\n
     * <rule_to_save_2>\n
     * ...
     */
    const lines = rules.split('\n');
    const meta  = lines[0].split('%');

    const syncTimestamp = +meta[0] || 0;

    return { syncTimestamp };
}

module.exports = {
    parseSlaveId,
    parseRules
};
