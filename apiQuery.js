const axios = require("axios");

/**
 * Get all the user LP tokens.
 *
 * @param walletAddress the wallet address
 * @returns {Promise<any|*[]>} the lp token array
 */
const getOwnerLPTokens = async (walletAddress) => {
    const url = [
        "https://api.elrond.com/accounts/",
        walletAddress,
        "/nfts?collections=",
        "EGLDMEXF-5bcc57",
        ",EGLDUSDCF-8600f8",
        ",MEXFARM-e7af52,EGLDMEXF-a4d81e,EGLDUSDCF-e3e01e,MEXFARM-5d1dbb,EGLDRIDEF-6c5d7c,EGLDMEXFL-ef2065,EGLDUSDCFL-f0031c,MEXFARML-28d646,EGLDRIDEFL-74b819,MEXRIDEF-bf0320,METARIDE-a68897,METARIDELK-bd8cda,LKFARM-9d1ea8&size=600"
    ].join("");

    const result = await axios.get(url);
    return result.data ? result.data : [];
};

/**
 * Get all the user locked mex tokens.
 *
 * @param walletAddress the wallet address
 * @returns {Promise<any|*[]>} the locked mex token array
 */
const getOwnerLockedMexTokens = async (walletAddress) => {
    const url = [
        "https://api.elrond.com/accounts/",
        walletAddress,
        "/nfts?collections=",
        "LKMEX-aab910",
        "&size=600"
    ].join("");

    const result = await axios.get(url);
    return result.data ? result.data : [];
};

/**
 * Get transaction details by hash.
 *
 * @param walletAddress the wallet address.
 * @returns {Promise<any|*[]>} the transaction details promise
 */
const getTransactionDetailByHash = async (walletAddress) => {
    const url = `https://api.elrond.com/transactions/${walletAddress}`;
    const result = await axios.get(url);
    return result.data ? result.data : [];
};

module.exports.getOwnerLPTokens = getOwnerLPTokens;
module.exports.getOwnerLockedMexTokens = getOwnerLockedMexTokens;
module.exports.getTransactionDetailByHash = getTransactionDetailByHash;
