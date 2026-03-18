import { Permission } from '../models/Permission.js';

export const getPermissions = async (req, res, next) => {
  try {
    const { role, resource } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (resource) filter.resource = resource;
    const permissions = await Permission.find(filter);
    res.json(permissions);
  } catch (err) {
    next(err);
  }
};

export const getPermission = async (req, res, next) => {
  try {
    const permission = await Permission.findOne({
      role: req.params.role,
      resource: req.params.resource
    });
    if (!permission) return res.status(404).json({ error: 'Permission not found' });
    res.json(permission);
  } catch (err) {
    next(err);
  }
};

export const createPermission = async (req, res, next) => {
  try {
    const { role, resource, actions } = req.body;
    const permission = new Permission({ role, resource, actions });
    await permission.save();
    res.status(201).json(permission);
  } catch (err) {
    next(err);
  }
};

export const updatePermission = async (req, res, next) => {
  try {
    const permission = await Permission.findOneAndUpdate(
      { role: req.params.role, resource: req.params.resource },
      { ...req.body, updatedAt: Date.now() },
      { returnDocument: 'after' }
    );
    if (!permission) return res.status(404).json({ error: 'Permission not found' });
    res.json(permission);
  } catch (err) {
    next(err);
  }
};

export const deletePermission = async (req, res, next) => {
  try {
    const permission = await Permission.findOneAndDelete({
      role: req.params.role,
      resource: req.params.resource
    });
    if (!permission) return res.status(404).json({ error: 'Permission not found' });
    res.json({ message: 'Permission deleted successfully' });
  } catch (err) {
    next(err);
  }
};