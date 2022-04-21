const fs = require("fs");
const BigNumber = require("bignumber.js");
const { strToHex, nbToHex, bigNumberToHex, sleepInMs} = require("./utils");
const {
    Account,
    Address,
    Balance,
    ChainID,
    GasLimit,
    NetworkConfig,
    parseUserKey,
    Transaction,
    TransactionHash,
    TransactionPayload,
    UserSigner
} = require("@elrondnetwork/erdjs/out");
const { getTransactionDetailByHash } = require("./apiQuery");

/**
 * The base path where all the pem files are stored.
 */
const BASE_WALLET_PATH = "./wallets";

/**
 * Get the signer from the public address.
 * PEM file must be stored into the wallets directory.
 *
 * @param walletAddress the wallet address
 * @returns {UserSigner} the signer
 */
const getSigner = (walletAddress) => {
    const pemFile = fs.readFileSync(`${BASE_WALLET_PATH}/${walletAddress}.pem`).toString("utf8");
    return new UserSigner(parseUserKey(pemFile, 0));
};

/**
 * Trigger the compound rewards transaction.
 *
 * @param signer the signer
 * @param provider the provider
 * @param token the token details (identifier, qty & nonce)
 * @param farmAddress the farm address
 * @param proxyAddress the proxy address
 * @returns {Promise<{success: boolean, hash: string}>} the transaction result
 */
const executeCompoundRewardsTxOnSinglePool = async (signer, provider, token, farmAddress, proxyAddress) => {
    const txData = [
        "ESDTNFTTransfer",
        strToHex(token.collection),
        nbToHex(token.nonce),
        bigNumberToHex(token.balance),
        new Address(proxyAddress).hex(),
        strToHex("compoundRewardsProxy"),
        new Address(farmAddress).hex()
    ].join("@");

    let tx = new Transaction({
        data: new TransactionPayload(txData),
        value: Balance.egld(0),
        gasLimit: new GasLimit(55000000),
        receiver: new Address(signer.getAddress().bech32()),
        chainID: new ChainID("1")
    });

    return await executeTransaction(signer, provider, tx, true);
};

/**
 * Trigger the claim rewards transaction.
 *
 * @param signer the signer
 * @param provider the provider
 * @param contractAddress the pool contract
 * @param token the token details (identifier, qty & nonce)
 * @returns {Promise<{success: boolean, hash: string}>} the transaction result
 */
const executeClaimPoolRewardsTx = async (signer, provider, contractAddress, token) => {
    const txData = [
        "ESDTNFTTransfer",
        strToHex(token.collection),
        nbToHex(token.nonce),
        bigNumberToHex(token.balance),
        new Address(contractAddress).hex(),
        strToHex("claimRewards")
    ].join("@");

    let tx = new Transaction({
        data: new TransactionPayload(txData),
        value: Balance.egld(0),
        gasLimit: 22000000,
        receiver: new Address(signer.getAddress().bech32()),
        chainID: new ChainID("1")
    });

    return await executeTransaction(signer, provider, tx, true);
};

const executeEnterFarmProxyTx = async (signer, provider, proxyContractAddress, intermediateContractAddress, mexToken, lockedMexLPStaked) => {
    const txDataArray = [
        "MultiESDTNFTTransfer",
        new Address(proxyContractAddress).hex(),
        nbToHex(lockedMexLPStaked ? 2 : 1)
    ];

    txDataArray.push(strToHex(mexToken.collection));
    txDataArray.push(nbToHex(mexToken.nonce));
    txDataArray.push(bigNumberToHex(mexToken.balance));

    if (lockedMexLPStaked) {
        txDataArray.push(strToHex(lockedMexLPStaked.collection));
        txDataArray.push(nbToHex(lockedMexLPStaked.nonce));
        txDataArray.push(bigNumberToHex(lockedMexLPStaked.balance));
    }

    txDataArray.push(strToHex("enterFarmProxy"));
    txDataArray.push(new Address(intermediateContractAddress).hex());

    const txData = txDataArray.join("@");

    let tx = new Transaction({
        data: new TransactionPayload(txData),
        value: Balance.egld(0),
        gasLimit: 55000000,
        receiver: new Address(signer.getAddress().bech32()),
        chainID: new ChainID("1")
    });

    return await executeTransaction(signer, provider, tx, true);
};

/**
 * Sign & Execute a given transaction.
 *
 * @param signer the signer
 * @param provider the provided
 * @param transaction the transaction
 * @returns {Promise<{success: boolean, hash: string}>} the promise tx result
 */
const executeTransaction = async (signer, provider, transaction, waitSmartContractPendingResult) => {
    let owner = new Account(signer.getAddress());
    await NetworkConfig.getDefault().sync(provider);

    await owner.sync(provider);

    transaction.setNonce(owner.getNonceThenIncrement());

    await signer.sign(transaction);
    await transaction.send(provider);
    await transaction.awaitExecuted(provider);
    await transaction.getAsOnNetwork(provider, false, true, true);
    await provider.getTransaction(TransactionHash.compute(transaction), signer.getAddress(), true);

    let hash = transaction.getHash().toString();
    let isSuccessful = transaction.getStatus().isSuccessful();

    if (waitSmartContractPendingResult) {
        let stop = false;
        let counter = 0;
        while (!stop) {
            if (counter === 10) {
                console.error(`Unable to track SC result (retry ${counter} times) for hash : ${hash}`);
            }

            const txDetail = await getTransactionDetailByHash(hash);
            if (!txDetail.hasOwnProperty("pendingResults") || !txDetail.pendingResults) {
                stop = true;
            }
            counter++;
            console.log(`SC Transaction execution not finished yet. Retry in 10 seconds`);
            await sleepInMs(10000);
        }
    }

    return { hash: hash, success: isSuccessful };
};

module.exports.getSigner = getSigner;
module.exports.executeEnterFarmProxyTx = executeEnterFarmProxyTx;
module.exports.executeClaimPoolRewardsTx = executeClaimPoolRewardsTx;
module.exports.executeCompoundRewardsTxOnSinglePool = executeCompoundRewardsTxOnSinglePool;
