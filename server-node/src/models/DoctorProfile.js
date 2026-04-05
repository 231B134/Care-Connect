const mongoose = require("mongoose");

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);