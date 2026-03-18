import mongoose from 'mongoose';

const formSchemaSchema = new mongoose.Schema({
  formType: { type: String, required: true, unique: true }, // e.g., 'intern-registration', 'task-creation'
  schema: { type: mongoose.Schema.Types.Mixed, required: true }, // JSON schema
  version: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
});

export const FormSchema = mongoose.model('FormSchema', formSchemaSchema);