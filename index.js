const NETWORK = require('./config/network.json');
const { ProxyProvider } = require("@elrondnetwork/erdjs/out");
const { getSigner } = require("./erdTransaction");
const { getOwnerLockedMexTokens } = require("./apiQuery");
const {
    claimRewards,
    compoundRewards,
    enterFarm,
} = require("./transaction");
const { getLpRewards } = require("./complexQuery");

// Main Config
const provider = new ProxyProvider(NETWORK.gatewayAddress);
const UserConfig = require('./config/userConfig.json');
const {sleepInMs} = require("./utils");

const start = async () => {
    const walletAddress = "erd1k3f09e6g3t48zl4qpusmmmdv4mz99524fe93mv9femhfmjzjqcqqgx2wcn";
    const signer = getSigner(walletAddress);

    let formattedLp = await getLpRewards(walletAddress);

    // Claim all farming pool rewards.
   //const toClaim = formattedLp.filter(lp => !lp.isStakingPool && lp.rewardsNumber > UserConfig.minRewards);
   //for (let i = 0; i < toClaim.length; i++) {
   //    const current = toClaim[i];

   //    if (!current.isStakingPool && current.rewardsNumber > UserConfig.minRewards) {
   //        await claimRewards(signer, provider, current.farmAddress, current);

   //        await sleepInMs(10000);
   //    }
   //}

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
}

start();
