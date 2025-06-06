const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    prescriptionNumber: {
        type: String,
        unique: true
    },
    addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomerAddress',
        required: true
    },
    deliveryAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        coordinates: {
            lat: Number,
            long: Number,
        },
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
    pharmacyAttempts: [
        {
            pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy" },
            status: {
                type: String,
                enum: ["pending", "accepted", "rejected"],
                default: "pending"
            },
            attemptedAt: { type: Date, default: Date.now }
        }
    ],
    deliveryPartnerAttempts: [
        {
            deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPartner" },
            status: {
                type: String,
                enum: ["pending", "accepted", "rejected"],
                default: "pending"
            },
            attemptedAt: { type: Date, default: Date.now }
        }
    ],
    pharmacyToCustomerRoute: {
        type: Array,
        default: []
    },
    pharmacyToDeliveryPartnerRoute: {
        type: Array,
        default: []
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
