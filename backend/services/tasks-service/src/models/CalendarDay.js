import mongoose from 'mongoose';

const calendarDaySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { type: String, enum: ['working', 'holiday', 'non_working'], default: 'working' },
  label: String, // optional e.g. "Republic Day"
});
calendarDaySchema.index({ date: 1 }, { unique: true });

export const CalendarDay = mongoose.model('CalendarDay', calendarDaySchema);
