const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
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
    notificationType: {
        type: String,
        enum: ["order_received",
            "pharmacy_order_request",
            "pathology_order_request",
            "delivery_partner_pickup_request",
            "delivery_partner_order_accepted",
            "manual_pharmacy_assignment",
            "manual_delivery_assignment",
            "delivery_partner_reached_pharmacy",
            "delivery_partner_received_order",
            "manual_pathology_assignment"
        ],
        default: null
    },
    NotificationTypeId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Notification", notificationSchema);
