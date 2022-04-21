const { getSigner } = require("./erdTransaction");

/**
 * Compute the node expression according to the specified number of hours.
 *
 * @param nbHours the nb of hours
 * @returns {string} the cron expression
 */
const getCronExpressionByNbHourOrThrowExpression = (nbHours) => {
    return nbHours === 24 ? "0 0 0 * * *" : `0 0 */${nbHours} * * *`;
};

const verifyConfig = (userConfig) => {
    // Verify cron triggering time
    assert(userConfig["executeEveryHour"] >= 1 && userConfig["executeEveryHour"] <= 24, "Invalid user config: executeEveryHour should be between 1 and 24.");

    // Verify wallets
    assert(userConfig.wallets && userConfig.wallets.length > 0, "Invalid user config: wallets not specified.");
    for (const wallet of userConfig.wallets) {
        try {
            getSigner(wallet.address);
        } catch (err) {
            assert(false, `Invalid wallets private key: ${wallet} is missing or invalid.`);
        }
    }
};

function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}

module.exports.verifyConfig = verifyConfig;
module.exports.getCronExpressionByNbHourOrThrowExpression = getCronExpressionByNbHourOrThrowExpression;
