import { FormSchema } from '../models/FormSchema.js';

export const getFormSchemas = async (req, res, next) => {
  try {
    const schemas = await FormSchema.find();
    res.json(schemas);
  } catch (err) {
    next(err);
  }
};

export const getFormSchema = async (req, res, next) => {
  try {
    const schema = await FormSchema.findOne({ formType: req.params.formType });
    if (!schema) return res.status(404).json({ error: 'Form schema not found' });
    res.json(schema);
  } catch (err) {
    next(err);
  }
};

export const createFormSchema = async (req, res, next) => {
  try {
    const { formType, schema, version } = req.body;
    const formSchema = new FormSchema({ formType, schema, version });
    await formSchema.save();
    res.status(201).json(formSchema);
  } catch (err) {
    next(err);
  }
};

export const updateFormSchema = async (req, res, next) => {
  try {
    const formSchema = await FormSchema.findOneAndUpdate(
      { formType: req.params.formType },
      { ...req.body, updatedAt: Date.now() },
      { returnDocument: 'after' }
    );
    if (!formSchema) return res.status(404).json({ error: 'Form schema not found' });
    res.json(formSchema);
  } catch (err) {
    next(err);
  }
};

export const deleteFormSchema = async (req, res, next) => {
  try {
    const formSchema = await FormSchema.findOneAndDelete({ formType: req.params.formType });
    if (!formSchema) return res.status(404).json({ error: 'Form schema not found' });
    res.json({ message: 'Form schema deleted successfully' });
  } catch (err) {
    next(err);
  }
};