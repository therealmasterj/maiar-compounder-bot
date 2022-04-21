const {getMaiarAccessToken, getFarmAddressFromLpCollection, getDecodedAttributes, getRewardsForPosition} = require("./maiarQuery");
const {getOwnerLPTokens} = require("./apiQuery");
const BigNumber = require("bignumber.js");

const getLpRewards = async (walletAddress) => {
    const maiarResult = await getMaiarAccessToken(walletAddress);
    const lockedLPs = await getOwnerLPTokens(walletAddress);
    const formattedLp = [];
    if (lockedLPs && lockedLPs.length > 0) {
        for (const lp of lockedLPs) {
            let attributes = lp.attributes;
            let address = getFarmAddressFromLpCollection(lp.collection);
            if (lp.collection.includes("LKFARM")) {
                const arg = [
                    {
                        identifier: lp.identifier,
                        attributes: lp.attributes
                    }
                ];

                const response = await getDecodedAttributes(arg, maiarResult["accessToken"]);
                const farmTokenId = response["wrappedFarmTokenAttributes"][0]["farmTokenID"];
                address = getFarmAddressFromLpCollection(farmTokenId);
                attributes = response["wrappedFarmTokenAttributes"][0]["farmTokenAttributes"]["attributes"];
            }

            formattedLp.push(
                {
                    farmAddress: address,
                    identifier: lp.identifier,
                    liquidity: lp.balance,
                    attributes: attributes
                }
            );
        }
    }

    const rewards = await getRewardsForPosition(formattedLp, maiarResult["accessToken"]);
    for (let i = 0; i < formattedLp.length; i++) {
        formattedLp[i].nonce = lockedLPs[i].nonce;
        formattedLp[i].balance = lockedLPs[i].balance;
        formattedLp[i].collection = lockedLPs[i].collection;
        formattedLp[i].isStakingPool = formattedLp[i].collection.includes("LKFARM");
        formattedLp[i].rewards = rewards["getRewardsForPosition"][i].rewards;
        formattedLp[i].rewardsNumber = new BigNumber(rewards["getRewardsForPosition"][i].rewards) / 10 ** 18;
    }

    return formattedLp;
};

module.exports.getLpRewards = getLpRewards;
