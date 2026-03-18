import mongoose from 'mongoose';

const workLogSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }, // optional for daily work submission
  internId: { type: String, required: true },
  hours: { type: Number, default: 0 },
  description: String,
  workLink: { type: String }, // GitHub or other daily work link
  loggedAt: { type: Date, default: Date.now }
});

export const WorkLog = mongoose.model('WorkLog', workLogSchema);