const mongoose = require('mongoose');

const notificationIdSchema = new mongoose.Schema({
  deviceToken: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('NotificationId', notificationIdSchema);

