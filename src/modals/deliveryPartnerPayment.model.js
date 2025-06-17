const mongoose = require('mongoose');

const DeliveryPartnerPayment = new mongoose.Schema({
    deliveryPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner',
        required: true,
    },
    orderId: {
        type: String,
        required: true,
        unique: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid',],
        default: 'pending',
    },
    paymentDate: {
        type: Date,
    },
    pharmacyCoordinates: {
        type: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        required: true,
    },
    userCoordinates: {
        type: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        required: true,
    },
    distanceInKm: {
        type: Number,
        required: true,
    },
    remarks: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('DeliveryPartnerPayment', DeliveryPartnerPayment);
