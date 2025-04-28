const mongoose = require('mongoose');

const EmergencyVehicleBookingSchema = new mongoose.Schema({
    patient_name: {
        type: String,
        required: true,
        trim: true,
    },
    patient_phone: {
        type: String,
        required: true,
        trim: true,
    },
    emergency_type: {
        type: String,
        enum: ['accident', 'medical', 'fire', 'other'],
        required: true,
    },
    location: {
        type: {
            lat: Number,
            lng: Number,
        },
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    destination_hospital: {
        type: String,
        trim: true,
    },
    vehicle_type: {
        type: String,
        enum: ['ambulance', 'fire_truck', 'rescue_van'],
        required: true,
    },
    booking_status: {
        type: String,
        enum: ['requested', 'assigned', 'on_route', 'completed', 'cancelled'],
        default: 'requested',
    },
    is_archived: {
        type: Boolean,
        default: false
      },
    // assigned_vehicle_id: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'EmergencyVehicle',
    // },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

EmergencyVehicleBookingSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('EmergencyVehicleBooking', EmergencyVehicleBookingSchema);
