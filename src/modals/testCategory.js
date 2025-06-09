const mongoose = require("mongoose");

const testCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  image_url: {
    type: String,
    default: "",
  },
  tests: {
    type: [
      {
        test_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Test",
          required: true,
        },
      },
    ],
    default: [],
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model("TestCategory", testCategorySchema);
