const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gender: { type: String, required: true },
  religion: { type: String, required: true },
  birthPlace: { type: String, required: true },
  birthDate: { type: Date, required: true },
  address: { type: String, required: true },
  parentPhone: { type: String, required: true },
  documents: { type: Array, default: [] },
});

module.exports = mongoose.model("Student", studentSchema);
