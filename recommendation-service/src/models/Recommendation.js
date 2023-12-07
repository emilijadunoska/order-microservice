const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const recommendationSchema = new Schema({
  recommendationId: {
    type: String,
    required: true,
    unique: true,
    primaryKey: true,
  },
  userId: { type: String, required: true },
  bookId: { type: String, required: true },
  type: { type: String, required: true },
  dateCreated: { type: Date, default: Date.now, required: true },
});

const Recommendation = mongoose.model("Recommendation", recommendationSchema);

module.exports = Recommendation;
