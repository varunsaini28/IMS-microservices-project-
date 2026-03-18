import mongoose from 'mongoose';

const workflowRuleSchema = new mongoose.Schema({
  entity: { type: String, required: true, default:'intern' },
  fromStatus: String,
  toStatus: String,
  allowedRoles: { type: [String], default: [] },
  requiredFields: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

export const WorkflowRule = mongoose.model('WorkflowRule', workflowRuleSchema);