const fs = require('fs');
const axios = require('axios');
const { getSigner } = require("./erdTransaction");
const { Address, SignableMessage } = require("@elrondnetwork/erdjs/out");

const queryAllFarms = async () => {
    const queryBody = `query ($offset: Int, $pairsLimit: Int) {
        farms {
            address
            farmedToken {
                name
                identifier
                decimals
                __typename
            }
            farmToken {
                name
                collection
                decimals
                __typename
            }
            farmingToken {
                name
                identifier
                decimals
                __typename
            }
            state
            penaltyPercent
            minimumFarmingEpochs
            version
            rewardType
            requireWhitelist
            __typename
        }
        pairs(offset: $offset, limit: $pairsLimit) {
            address
            firstToken {
                name
                identifier
                decimals
                __typename
            }
            secondToken {
                name
                identifier
                decimals
                __typename
            }
            liquidityPoolToken {
                name
                identifier
                decimals
                __typename
            }
            state
            totalFeePercent
            specialFeePercent
            type
            __typename
        }
        proxy {
            address
            wrappedLpToken {
                collection
                name
                decimals
                __typename
            }
            wrappedFarmToken {
                collection
                name
                decimals
                __typename
            }
            lockedAssetToken {
                collection
                name
                decimals
                __typename
            }
            assetToken {
                identifier
                name
                decimals
                __typename
            }
            intermediatedPairs
            intermediatedFarms
            __typename
        }
        stakingProxies {
            address
            dualYieldToken {
                collection
                name
                decimals
                __typename
            }
            farmToken {
                collection
                name
                decimals
                __typename
            }
            lpFarmToken {
                collection
                name
                decimals
                __typename
            }
            lpFarmAddress
            pairAddress
            stakingFarmAddress
            __typename
        }
    }`;

    const result = await axios.post("https://graph.maiar.exchange/graphql", { query: queryBody, variables: { offset: 0, pairsLimit: 500 }});
    return result.data.data.farms;

};

const getAllFarms = () => {
    return getFarmConfig()["farms"];
};

const getFarmConfig = () => {
    return JSON.parse(fs.readFileSync("./config/allFarms.json")).data;
};

/**
 * Get owner rewards by access tokens.
 *
 * @param variableArray all rewards type
 * @param accessToken the access token
 * @returns {Promise<*>} the pending owner rewards
 */
const getRewardsForPosition = async (variableArray, accessToken) => {
    const queryBody =
        `query ($getRewardsForPositionArgs: BatchFarmRewardsComputeArgs!) {
          getRewardsForPosition(farmsPositions: $getRewardsForPositionArgs) {
            rewards
            remainingFarmingEpochs
            decodedAttributes {
              aprMultiplier
              compoundedReward
              initialFarmingAmount
              currentFarmAmount
              lockedRewards
              identifier
              __typename
            }
            __typename
          }
        }`;

    const variables =
        {
            "getRewardsForPositionArgs":{
                "farmsPositions": variableArray
            }
        };

    let config = {
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${accessToken}`
        }
    }

    const result = await axios.post("https://graph.maiar.exchange/graphql", { query: queryBody, variables: variables}, config);
    return result.data.data;
};

const getDecodedAttributes = async (variableArray, accessToken) => {
    const queryBody =
        `query ($args: DecodeAttributesArgs!) {
            wrappedFarmTokenAttributes(args: $args) {
                identifier
                farmTokenID
                farmTokenAttributes {
                    attributes
                    __typename
                }
                farmingTokenID
                farmingTokenNonce
                __typename
        }
    }`;

    const variables =
        {
            "args": {
                "batchAttributes": variableArray
            }
        };

    let config = {
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${accessToken}`
        }
    }

    const result = await axios.post("https://graph.maiar.exchange/graphql", { query: queryBody, variables: variables}, config);
    return result.data.data;
};

/**
 * Get a login token from Maiar Portal.
 *
 * @returns {Promise<*>} the login token
 */
const getMaiarLoginToken = async() => {
    const url = `https://id.maiar.com/api/v1/login/init`;
    const res = await axios.post(url);
    return res.data['loginToken'];
};

/**
 * Get an access token from the user wallet pem.
 *
 * @param walletAddress the wallet address
 * @returns {Promise<any>} the access token response
 */
const getMaiarAccessToken = async (walletAddress) => {

    // Get a login token from Maiar
    const loginToken = await getMaiarLoginToken();

    // Load the signer object
    const signer = getSigner(walletAddress);

    // Create & Sign the message for authenticating to Maiar GraphQL API
    let message = new SignableMessage({
        message: Buffer.from(`${walletAddress}${loginToken}{}`),
        address: new Address(walletAddress)
    });

    await signer.sign(message);

    // Get the token result
    const result = await axios.post("https://id.maiar.com/api/v1/login",
        { address : walletAddress, loginToken: loginToken, signature: message.signature.hex(), data: {}}
    );

    return result.data;
};

const getFarmAddressFromLpCollection = (collection) => {
    const allFarms = getAllFarms();
    const found = allFarms.find(farm => farm["farmToken"]["collection"] === collection);
    return found ? found.address : null;
};

// Maiar Authentication
module.exports.getMaiarLoginToken = getMaiarLoginToken;
module.exports.getMaiarAccessToken = getMaiarAccessToken;

// GraphQL Queries
module.exports.getFarmConfig = getFarmConfig;
module.exports.getAllFarms = getAllFarms;
module.exports.getDecodedAttributes = getDecodedAttributes;
module.exports.getRewardsForPosition = getRewardsForPosition;
module.exports.getFarmAddressFromLpCollection = getFarmAddressFromLpCollection;