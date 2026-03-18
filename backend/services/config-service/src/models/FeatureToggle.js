import mongoose from 'mongoose';

const featureToggleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  description: String,
  updatedAt: { type: Date, default: Date.now }
});

export const FeatureToggle = mongoose.model('FeatureToggle', featureToggleSchema);