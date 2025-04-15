const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
    },
    recipientType: {
        type: String,
        enum: ["customer", "delivery_partner", "admin", "pharmacy", "pathology"],
        required: true,
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "recipientType",
        required: true,
    },
    status: {
        type: String,
        enum: ["read", "unread"],
        default: "unread",
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Notification", notificationSchema);
