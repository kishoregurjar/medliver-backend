const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    razorpay_order_id: {
        type: String,
        required: true,
    },
    razorpay_payment_id: {
        type: String,
        required: true,
    },
    razorpay_signature: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: "INR",
    },
    status: {
        type: String,
        enum: ["created", "authorized", "captured", "failed"],
        required: true,
        default: 'created'
    },
    method: {
        type: String, // upi, card, netbanking, wallet, etc.
    },
    email: {
        type: String,
    },
    contact: {
        type: String,
    },
    vpa: {
        type: String,
    },
    bank: {
        type: String,
    },
    wallet: {
        type: String,
    },
    description: {
        type: String,
    },
    fee: {
        type: Number,
    },
    tax: {
        type: Number,
    },
    rrn: {
        type: String,
    },
    upi_transaction_id: {
        type: String,
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model("Payment", paymentSchema);
