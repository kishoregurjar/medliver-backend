const mongoose = require("mongoose");

const doctorLeadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: null
    },
    address: {
        type: String
    },
    disease: {
        type: String
    },
    is_archived: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["pending", "completed", "rejected"],
        default: "pending",
    },
}, { timestamps: true });

// Auto-update updated_at on save
doctorLeadSchema.pre("save", function (next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.model("DoctoreLead", doctorLeadSchema);
