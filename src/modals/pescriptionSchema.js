const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    prescriptionNumber: {
        type: String,
        unique: true
    },
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
        enum: ["pending",
            "accepted_by_pharmacy",
            "assigned_to_delivery_partner",
            "assigned_to_pharmacy",
            "accepted_by_delivery_partner",
            "need_manual_assignment_to_pharmacy",
            "need_manual_assignment_to_delivery_partner",
            "accepted_by_delivery_partner_and_reached_pharmacy",
            "out_for_pickup",
            "picked_up",
            "out_for_delivery",
            "delivered",
            "cancelled",
            "reached_pharmacy",
            "reached_destination"],
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
