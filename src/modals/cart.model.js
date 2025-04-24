const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
    item_type: {
        type: String,
        enum: ["Medicine", "test"],
        required: true
    },
    item_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "items.item_type"
    },
    quantity: {
        type: Number,
        default: 1
    },
    price: {
        type: Number,
        required: true
    },
    name: String,
    details: Object
});

const cartSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    items: [cartItemSchema],
    total_price: {
        type: Number,
        default: 0
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

cartSchema.pre("save", function (next) {
    this.updated_at = new Date();
    this.total_price = this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    next();
});

module.exports = mongoose.model("Cart", cartSchema);
