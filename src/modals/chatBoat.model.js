// models/ChatHistory.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true }, // identify user/session
    history: [
        {
            role: { type: String, enum: ['user', 'assistant'], required: true },
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatBoatHistory', chatSchema);
