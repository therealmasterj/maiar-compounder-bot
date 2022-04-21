const { executeCompoundRewardsTxOnSinglePool, executeClaimPoolRewardsTx, executeEnterFarmProxyTx} = require("./erdTransaction");
const { sendWebhookMessage } = require("./webhook");
const { getFarmConfig } = require("./maiarQuery");

const claimRewards = async (signer, provider, contractAddress, lpStaked) => {
    console.log(`Start claimRewards function with signer ${signer.getAddress().bech32()} for LP ${lpStaked.collection} ...`);
    const txResult = await executeClaimPoolRewardsTx(signer, provider, contractAddress, lpStaked);
    console.info(`Transaction ${txResult.success ? "success" : "failed"} with hash ${txResult.hash}`)
    console.log(`End claimRewards function...`);
    sendWebhookMessage(`claimRewards: Tx ${txResult.success ? "OK " : "KO"}. \nTx: https://explorer.elrond.com/transactions/${txResult.hash}`);
};

const compoundRewards = async (signer, provider, lockedMexLPStaked) => {
    const farmConfig = getFarmConfig();
    console.log(`Start compoundRewards function with signer ${signer.getAddress().bech32()} for LP ${lockedMexLPStaked.collection} ...`);
    const txResult = await executeCompoundRewardsTxOnSinglePool(
        signer,
        provider,
        lockedMexLPStaked,
        lockedMexLPStaked.farmAddress,
        farmConfig["proxy"]["address"]
    );
    console.info(`Transaction ${txResult.success ? "success" : "failed"} with hash ${txResult.hash}`)
    console.log(`End compoundRewards function...`);
    sendWebhookMessage(`compoundRewards: Tx ${txResult.success ? "OK " : "KO"}. \nTx: https://explorer.elrond.com/transactions/${txResult.hash}`);
};

const enterFarm = async (signer, provider, lockedMexToken, lockedMexLPStaked) => {
    console.log(`Start enterFarmProxy function with signer ${signer.getAddress().bech32()} with LockedMex ...`);
    const proxy = "erd1qqqqqqqqqqqqqpgqrc4pg2xarca9z34njcxeur622qmfjp8w2jps89fxnl";
    const intermediate = "erd1qqqqqqqqqqqqqpgq7qhsw8kffad85jtt79t9ym0a4ycvan9a2jps0zkpen";
    const txResult = await executeEnterFarmProxyTx(signer, provider, proxy, intermediate, lockedMexToken, lockedMexLPStaked);
    console.info(`Transaction ${txResult.success ? "success" : "failed"} with hash ${txResult.hash}`)
    console.log(`End enterFarm function...`);
    sendWebhookMessage(`enterFarmProxy: Tx ${txResult.success ? "OK" : "KO"}. \nTx: https://explorer.elrond.com/transactions/${txResult.hash}`);
};

module.exports.claimRewards = claimRewards;
module.exports.compoundRewards = compoundRewards;
module.exports.enterFarm = enterFarm;
