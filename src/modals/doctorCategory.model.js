const mongoose = require("mongoose");

const doctorCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    image_url: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: null
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

// Auto-update updated_at on save
doctorCategorySchema.pre("save", function (next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.model("DoctorCategory", doctorCategorySchema);
