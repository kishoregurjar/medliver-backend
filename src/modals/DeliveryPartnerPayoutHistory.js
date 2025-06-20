const mongoose = require('mongoose');

const DeliveryPartnerPayoutHistorySchema = new mongoose.Schema({
    deliveryPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner',
        required: true
    },
    orderIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    earningIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartnerPayment'
    }],
    totalAmountPaid: {
        type: Number,
        required: true
    },
    remarks: {
        type: String
    },
    paidAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DeliveryPartnerPayoutHistory', DeliveryPartnerPayoutHistorySchema);
