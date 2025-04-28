const mongoose = require("mongoose");

const testCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    image_url: {
        type: String,
        default: "" // You can set a default image URL here if you want
    },
    tests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test"
    }],
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

testCategorySchema.pre("save", function (next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.model("TestCategory", testCategorySchema);
