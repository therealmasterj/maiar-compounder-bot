const cron = require('node-cron');
const UserConfig = require('./config/userConfig.json');
const { getCronExpressionByNbHourOrThrowExpression, verifyConfig } = require("./config");
const { getSigner } = require("./erdTransaction");
const { getLpRewards } = require("./complexQuery");
const { claimRewards, compoundRewards, enterFarm } = require("./transaction");
const { getOwnerLockedMexTokens } = require("./apiQuery");
const {ProxyProvider} = require("@elrondnetwork/erdjs/out");
const NETWORK = require("./config/network.json");
const {sendWebhookMessage } = require("./webhook");

verifyConfig(UserConfig);

const provider = new ProxyProvider(NETWORK.gatewayAddress);
const nodeExpression = getCronExpressionByNbHourOrThrowExpression(UserConfig.executeEveryHour);

cron.schedule(nodeExpression, async () => {
    for (const wallet of UserConfig.wallets) {
        const walletAddress = wallet.address;
        await sendWebhookMessage(`Start compounding bot with wallet ${wallet.name}. Address: ${walletAddress}`);
        console.log(`Start compounding bot with wallet ${wallet.name}. Address: ${walletAddress}`);
        const signer = getSigner(walletAddress);

        let formattedLp = await getLpRewards(walletAddress);

        // Claim all farming pool rewards.
        const toClaim = formattedLp.filter(lp => !lp.isStakingPool && lp.rewardsNumber > UserConfig.minRewards);
        for (let i = 0; i < toClaim.length; i++) {
            const current = toClaim[i];

            if (!current.isStakingPool && current.rewardsNumber > UserConfig.minRewards) {
                await claimRewards(signer, provider, current.farmAddress, current);
            }
        }

        // Compound main pool
        const toCompound = formattedLp.filter(lp => lp.isStakingPool && lp.rewardsNumber > UserConfig.minRewards);
        for (let i = 0; i < toCompound.length; i++) {
            await compoundRewards(signer, provider, toCompound[i]);
        }

        // Re-enter in main pool with claimed rewards
        const lockedMexTokens = await getOwnerLockedMexTokens(walletAddress);
        let mainPool = (await getLpRewards(walletAddress)).filter(lp => lp.isStakingPool);

        for (let i = 0; i < lockedMexTokens.length; i++) {
            const currentLockedMex = lockedMexTokens[i];
            await enterFarm(signer, provider, currentLockedMex, mainPool ? mainPool[0] : undefined);

            // Re-calculate main pool
            mainPool = (await getLpRewards(walletAddress)).filter(lp => lp.isStakingPool);
        }

        await sendWebhookMessage(`End compounding bot with wallet ${wallet.name}. Address: ${walletAddress}`);
    }
});