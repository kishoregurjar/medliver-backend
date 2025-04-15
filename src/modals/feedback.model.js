const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
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
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
    },
    comments: {
        type: String,
        required: true,
    },
    feedbackDate: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Feedback", feedbackSchema);
