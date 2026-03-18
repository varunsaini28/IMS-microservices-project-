import { WorkflowRule } from '../models/WorkflowRule.js';

export const getWorkflowRules = async (req, res, next) => {
  try {
    const rules = await WorkflowRule.find();
    res.json(rules);
  } catch (err) {
    next(err);
  }
};

export const getWorkflowRulesByEntity = async (req, res, next) => {
  try {
    const rules = await WorkflowRule.find({ entity: req.params.entity });
    if (!rules.length) return res.status(404).json({ error: 'No rules found for this entity' });
    res.json(rules);
  } catch (err) {
    next(err);
  }
};

export const createWorkflowRule = async (req, res, next) => {
  try {
    const { entity, fromStatus, toStatus, allowedRoles, requiredFields } = req.body;
    const rule = new WorkflowRule({ entity, fromStatus, toStatus, allowedRoles, requiredFields });
    await rule.save();
    res.status(201).json(rule);
  } catch (err) {
    next(err);
  }
};

export const updateWorkflowRule = async (req, res, next) => {
  try {
    const rule = await WorkflowRule.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { returnDocument: 'after' }
    );
    if (!rule) return res.status(404).json({ error: 'Workflow rule not found' });
    res.json(rule);
  } catch (err) {
    next(err);
  }
};

export const deleteWorkflowRule = async (req, res, next) => {
  try {
    const rule = await WorkflowRule.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Workflow rule not found' });
    res.json({ message: 'Workflow rule deleted successfully' });
  } catch (err) {
    next(err);
  }
};