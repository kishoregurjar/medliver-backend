const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    prescriptions: [
        {
            path: { type: String, required: true },
            uploaded_at: { type: Date, default: Date.now },
        }
    ],
    assigned_pharmacy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        default: null,
    },
    assigned_delivery_partner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner',
        default: null,
    },
    total_amount: {
        type: Number,
        default: 0,
    },
    bill_path: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        enum: ['pending', 'assigned_to_pharmacy', 'ready_for_delivery', 'delivered'],
        default: 'pending'
    },
    remarks: {
        type: String,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('prescriptionSchema', prescriptionSchema);
