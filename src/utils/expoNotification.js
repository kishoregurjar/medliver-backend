const axios = require('axios');

module.exports.sendExpoNotification = async (tokens, title, body, data = {}) => {
    console.log("tokens", tokens, title, body, data);
    if (tokens.length === 0) return false;

    const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data // pass any custom data here
    }));

    const response = await axios.post('https://exp.host/--/api/v2/push/send', messages, {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return response.data;
};
