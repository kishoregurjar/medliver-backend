const mongoose = require('mongoose');

const testClickSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    test_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true,
    },
    clicked_at: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('testClickHistory', testClickSchema);
