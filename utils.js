const bf = require('buffer');
const BigNumber = require("bignumber.js");

/**
 * Convert a number to hex.
 *
 * @param nb the nb
 * @returns string the hex number
 */
const nbToHex = (nb) => {
    if (nb === 0) {
        return "";
    }

    const hexStringNumber = nb.toString(16);
    return hexStringNumber.length %2 !== 0 ? `0${hexStringNumber}` : hexStringNumber;
};

/**
 * Convert a string nb to big number to hex.
 *
 * @param stringNb the string nb
 * @returns string the hex number
 */
const bigNumberToHex = (stringNb) => {
    const bnHex = new BigNumber(stringNb).toString(16);
    return bnHex.length %2 !== 0 ? `0${bnHex}` : bnHex;
};

/**
 * Convert a string to hex.
 *
 * @param str the string
 * @returns {string} the hex result
 */
const strToHex = (str) => {
    return bf.Buffer.from(new TextEncoder().encode(str)).toString("hex");
}

/**
 * Sleep during specified time.
 *
 * @param ms the time in ms
 */
const sleepInMs = async (ms) => {
    console.log(`Sleep ${ms/1000} seconds now...`);
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.sleepInMs = sleepInMs;
module.exports.nbToHex = nbToHex;
module.exports.bigNumberToHex = bigNumberToHex;
module.exports.strToHex = strToHex;