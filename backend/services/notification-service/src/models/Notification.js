import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId:   { type: String, required: false, default: null, index: true },
  type: String, // 'user.registered', 'intern.created', 'task.assigned', etc.
  title: String,
  body: String,
  data: mongoose.Schema.Types.Mixed,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.model('Notification', notificationSchema);