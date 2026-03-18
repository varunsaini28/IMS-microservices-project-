import { FeatureToggle } from '../models/FeatureToggle.js';

export const getFeatureToggles = async (req, res, next) => {
  try {
    const toggles = await FeatureToggle.find();
    res.json(toggles);
  } catch (err) {
    next(err);
  }
};

export const getFeatureToggle = async (req, res, next) => {
  try {
    const toggle = await FeatureToggle.findOne({ name: req.params.name });
    if (!toggle) return res.status(404).json({ error: 'Feature not found' });
    res.json(toggle);
  } catch (err) {
    next(err);
  }
};

export const createFeatureToggle = async (req, res, next) => {
  try {
    const { name, enabled, description } = req.body;
    const toggle = new FeatureToggle({ name, enabled, description });
    await toggle.save();
    res.status(201).json(toggle);
  } catch (err) {
    next(err);
  }
};

export const updateFeatureToggle = async (req, res, next) => {
  try {
    const toggle = await FeatureToggle.findOneAndUpdate(
      { name: req.params.name },
      { ...req.body, updatedAt: Date.now() },
      { returnDocument: 'after' }
    );
    if (!toggle) return res.status(404).json({ error: 'Feature not found' });
    res.json(toggle);
  } catch (err) {
    next(err);
  }
};

export const deleteFeatureToggle = async (req, res, next) => {
  try {
    const toggle = await FeatureToggle.findOneAndDelete({ name: req.params.name });
    if (!toggle) return res.status(404).json({ error: 'Feature not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
};