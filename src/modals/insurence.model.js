const mongoose = require('mongoose');

const InsuranceLeadSchema = new mongoose.Schema({
    full_name: {
        type: String,
        required: true,
        trim: true,
    },

    phone_number: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
    },
    lead_type: {
        type: String,
        enum: ['health', 'life'],
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true,
    },
    smoker: {
        type: Boolean,
        default: false,
    },
    pre_existing_conditions: {
        type: [String],
        default: [],
    },
    income: {
        type: Number,
        required: function () {
            return this.lead_type === 'life';
        },
    },
    nominee_name: {
        type: String,
    },
    nominee_relation: {
        type: String,
    },
    is_archived: {
        type: Boolean,
        default: false
      },
    coverage_for: {
        type: String,
        enum: ['self', 'family'],
        required: true,
    },
    family_member_count: {
        type: Number,
        required: function () {
            return this.coverage_for === 'family';
        },
    },
    lead_source: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'interested', 'not_interested', 'converted'],
        default: 'new',
    },
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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

InsuranceLeadSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('InsuranceLead', InsuranceLeadSchema);
