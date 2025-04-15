const mongoose = require("mongoose");

const stockLogSchema = new mongoose.Schema({
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Medicine",
        required: true,
    },
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pharmacy",
        required: true,
    },
    changeQuantity: {
        type: Number,
        required: true,
    },
    changeType: {
        type: String,
        enum: ["addition", "subtraction"],
        required: true,
    },
    reason: {
        type: String,
        enum: ["purchase", "sale", "stock correction"],
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("StockLog", stockLogSchema);
