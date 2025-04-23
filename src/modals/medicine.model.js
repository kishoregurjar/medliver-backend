const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            // required: true,
        },
        manufacturer: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        isPrescriptionRequired: {
            type: Boolean,
            default: false,
        },
        category: {
            type: String,
            enum: ["Antibiotic", "Analgesic", "Antipyretic", "Others"],
        },
        packSizeLabel: {
            type: String,
            default: null
        },
        short_composition1: {
            type: String,
            default: null
        },
        short_composition2: {
            type: String,
            default: null
        },
        images: {
            type: String,
            default: null
        },
        type: {
            type: String,
            default: "allopathy"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);
