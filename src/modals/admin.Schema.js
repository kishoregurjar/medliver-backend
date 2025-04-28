const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Admin must have a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Admin must have an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Admin must have a password'],
        minlength: [8, 'Password must be at least 8 characters'],
    },
    role: {
        type: String,
        enum: ['pharmacy', 'superadmin', 'pathology', 'delivery_partner'], 
        default: 'admin',
        required: true
    },
    avatar: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    deviceToken: {
        type: String,
        default: null,
    },
}, {
    timestamps: true 
});


// adminSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) return next();
//     this.password = await bcrypt.hash(this.password, 12);
//     next();
// });



module.exports = mongoose.model('Admin', adminSchema);
