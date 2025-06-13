const axios = require('axios');

module.exports.sendExpoNotification = async (tokens, title, body, data = {}) => {
  try {
    if (!tokens || tokens.length === 0) return false;

    const sendPromises = tokens.map(token =>
      axios.post('https://exp.host/--/api/v2/push/send', {
        to: token,
        sound: 'default',
        title,
        body,
        data,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
    const responses = await Promise.all(sendPromises);
    const results = responses.map(res => res.data);
    return results;
  } catch (error) {
    console.error("❌ Notification send error:", error.message);
    return false;
  }
};