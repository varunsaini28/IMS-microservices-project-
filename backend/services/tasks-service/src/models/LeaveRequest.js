import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  internId: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: String,
  createdAt: { type: Date, default: Date.now }
});

export const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);