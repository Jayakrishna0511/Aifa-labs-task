import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['Employee', 'Project Manager'], default: 'Employee' }
});

const LogSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  date: { type: Date, default: Date.now },
  yesterday: String,
  today: String,
  blockers: String
});

const NotificationSchema = new mongoose.Schema({
  recipientId: mongoose.Schema.Types.ObjectId,
  message: String,
  sender: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);
export const Log = mongoose.model('Log', LogSchema);
export const Notification = mongoose.model('Notification', NotificationSchema);
