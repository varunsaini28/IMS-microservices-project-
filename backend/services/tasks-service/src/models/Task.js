import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  projectId: String,        // reference to Projects service
  assignedTo: { type: String, required: true },  // intern user_id
  assignedToEmail: String,  // for deadline reminder emails
  assignedBy: { type: String, required: true },  // manager user_id
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'blocked'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: Date,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

export const Task = mongoose.model('Task', taskSchema);