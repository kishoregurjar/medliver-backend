// models/searchHistory.model.js
const mongoose = require("mongoose");

const searchHistorySchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    keyword: { type: String, required: true },
    searched_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("searchHistory", searchHistorySchema);
