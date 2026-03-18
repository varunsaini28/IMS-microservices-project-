import { env } from '../config/env.js';

export const internalKey = (req, res, next) => {
  const key = req.headers['x-internal-key'];
  if (!env.internalApiKey || key !== env.internalApiKey) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
