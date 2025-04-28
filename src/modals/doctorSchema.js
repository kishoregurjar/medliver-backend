const mongoose = require("mongoose");

const doctorProfileSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Ensuring the email is unique
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6 // Minimum password length
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
        ref: "DoctorCategory", // Referring to the category the doctor belongs to
        required: true
    }],
    category: [{
        type: String, // Array to store category names for easy access
        required: true
    }],
    profile_image: {
        type: String, // URL to the doctor's profile image
        required: true
    },
    qualifications: {
        type: [String], // Array of qualifications
        required: true
    },
    specialties: {
        type: [String], // Array of specialties like cardiology, dentistry etc.
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
        unique: true // Ensuring phone number is unique
    },
    available_at_home: {
        type: Boolean,
        default: false // Whether the doctor provides home consultation
    },
    consultation_fee: {
        type: Number,
        required: true
    },
    availability: {
        monday: {
            type: [String], // Array to store available slots (e.g., ["9AM-12PM", "2PM-5PM"])
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
        type: String, // Number of years of experience
        required: true
    },
    description: {
        type: String, // A short bio or description about the doctor
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
    }
});

// Auto-update updated_at on save
doctorProfileSchema.pre("save", function (next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);
