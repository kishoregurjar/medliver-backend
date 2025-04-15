const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        manufacturer: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        stock: {
            type: Number,
            default: 0,
        },
        isPrescriptionRequired: {
            type: Boolean,
            default: false,
        },
        expiryDate: {
            type: Date,
        },
        category: {
            type: String,
            enum: ["Antibiotic", "Analgesic", "Antipyretic", "Others"],
        },
        image: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);
