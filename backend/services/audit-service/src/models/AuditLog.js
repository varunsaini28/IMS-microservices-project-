import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  routingKey: { type: String, required: true, index: true },
  event: { type: mongoose.Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Index for common queries
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ routingKey: 1, timestamp: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);