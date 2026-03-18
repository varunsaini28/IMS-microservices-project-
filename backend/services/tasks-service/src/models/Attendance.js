import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  internId: { type: String, required: true },
  date: { type: Date, required: true },
  checkIn: Date,
  checkOut: Date,
  status: { type: String, enum: ['present', 'absent', 'half-day', 'holiday'] }
});

// Ensure one record per intern per day
attendanceSchema.index({ internId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', attendanceSchema);