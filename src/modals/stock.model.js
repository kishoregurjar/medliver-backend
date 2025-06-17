const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pharmacy",
        required: true,
    },
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Medicine",
        required: true,
    },
    quantity: {
        type: Number,
        default: 0,
    },
    price: {
        type: Number,
       
    },
    discount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

stockSchema.index({ pharmacyId: 1, medicineId: 1 }, { unique: true });

module.exports = mongoose.model("Stock", stockSchema);
