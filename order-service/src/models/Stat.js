const mongoose = require("mongoose");

const statSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
});

const Stat = mongoose.model("Stat", statSchema);

module.exports = Stat;
