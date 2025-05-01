const mongoose = require("mongoose");

const doctorProfileSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true
    },
    category_id: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "DoctorCategory",
        required: true
    }],
    category: [{
        type: String,
        required: true
    }],
    profile_image: {
        type: String,
        required: true
    },
    qualifications: {
        type: [String],
        required: true
    },
    specialties: {
        type: [String],
        required: true
    },
    clinic_name: {
        type: String,
        required: true
    },
    clinic_address: {
        type: String,
        required: true
    },
    phone_number: {
        type: String,
        required: true,
        unique: true
    },
    available_at_home: {
        type: Boolean,
        default: false
    },
    consultation_fee: {
        type: Number,
        required: true
    },
    availability: {
        monday: {
            type: [String],
            default: []
        },
        tuesday: {
            type: [String],
            default: []
        },
        wednesday: {
            type: [String],
            default: []
        },
        thursday: {
            type: [String],
            default: []
        },
        friday: {
            type: [String],
            default: []
        },
        saturday: {
            type: [String],
            default: []
        },
        sunday: {
            type: [String],
            default: []
        }
    },
    experience: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    is_active: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        default: "doctor"
    },
    otp: {
        type: Number,
        default: null
    }
});

doctorProfileSchema.pre("save", function (next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);
