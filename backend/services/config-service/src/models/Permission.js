import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  role: { type: String, required: true }, // 'admin', 'manager', 'intern'
  resource: { type: String, required: true }, // 'intern', 'task', 'project', etc.
  actions: [String], // ['create', 'read', 'update', 'delete', 'approve']
  updatedAt: { type: Date, default: Date.now }
});

// Composite unique index
permissionSchema.index({ role: 1, resource: 1 }, { unique: true });

export const Permission = mongoose.model('Permission', permissionSchema);