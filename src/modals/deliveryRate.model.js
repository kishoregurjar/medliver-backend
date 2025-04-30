const mongoose = require("mongoose");

const deliveryRateSchema = new mongoose.Schema({
    per_km_price: {
        type: Number,
        required: true
    },
    is_active: {
        type: Boolean,
        default: false
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

deliveryRateSchema.pre("save", function (next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model("DeliveryRate", deliveryRateSchema);
