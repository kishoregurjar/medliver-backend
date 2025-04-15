const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ["UPI", "card", "cash", "wallet"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
    },
    paymentDate: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Payment", paymentSchema);
