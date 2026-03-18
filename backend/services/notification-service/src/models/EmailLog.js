import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
  to: String,
  subject: String,
  body: String,
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  error: String,
  createdAt: { type: Date, default: Date.now }
});

export const EmailLog = mongoose.model('EmailLog', emailLogSchema);