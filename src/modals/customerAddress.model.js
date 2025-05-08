const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    address_type: {
        type: String,
        enum: ['home', 'work', 'hospital', 'other'],
        default: 'home',
    },
    house_number: {
        type: String,
        trim: true,
    },
    street: {
        type: String,
        trim: true,
    },
    landmark: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        default: 'India',
    },
    location: {
        lat: Number,
        lng: Number,
    },
    is_default: {
        type: Boolean,
        default: false,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

AddressSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('CustomerAddress', AddressSchema);
