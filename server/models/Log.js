import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  date: { type: Date, default: Date.now },
  yesterday: String,
  today: String,
  blockers: String
});

export default mongoose.models.Log || mongoose.model("Log", logSchema);
