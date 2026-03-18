import { Setting } from '../models/Setting.js';

export const getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.find();
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

export const getSetting = async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    if (!setting) return res.status(404).json({ error: 'Setting not found' });
    res.json(setting);
  } catch (err) {
    next(err);
  }
};

export const createSetting = async (req, res, next) => {
  try {
    const { key, value, type, description } = req.body;
    const setting = new Setting({ key, value, type, description });
    await setting.save();
    res.status(201).json(setting);
  } catch (err) {
    next(err);
  }
};

export const updateSetting = async (req, res, next) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { ...req.body, updatedAt: Date.now() },
      { returnDocument: 'after' }
    );
    if (!setting) return res.status(404).json({ error: 'Setting not found' });
    res.json(setting);
  } catch (err) {
    next(err);
  }
};

export const deleteSetting = async (req, res, next) => {
  try {
    const setting = await Setting.findOneAndDelete({ key: req.params.key });
    if (!setting) return res.status(404).json({ error: 'Setting not found' });
    res.json({ message: 'Setting deleted successfully' });
  } catch (err) {
    next(err);
  }
};