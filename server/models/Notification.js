import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipientId: mongoose.Schema.Types.ObjectId,
  message: String,
  sender: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
