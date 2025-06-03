const mongoose = require("mongoose");

const promoBannerSchema = new mongoose.Schema(
    {
        bannerImageUrl: {
            type: String,
            required: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId
        },
        path: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ["medicine", "test"],
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        },
        isActive: {
            type: Boolean,
            default: true
        },
        priority: {
            type: Number,
            default: 1
        },
        redirectUrl: {
            type: String // Optional URL to redirect on banner click
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("PromoBanner", promoBannerSchema);
