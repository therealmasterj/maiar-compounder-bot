const axios = require('axios');
const userConfig = require('./config/userConfig.json');

const sendWebhookMessage = async (message) => {
    if (userConfig.webhookUrl) {
        await axios.post(userConfig.webhookUrl, { content: message });
    }
};

module.exports.sendWebhookMessage = sendWebhookMessage;
