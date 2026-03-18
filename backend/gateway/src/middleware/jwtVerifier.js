import { env } from '../config/env.js';

const PUBLIC_ROUTES = ['/auth', '/health'];

export const verifyJwt = async (req, res, next) => {

  // ✅ use req.originalUrl to get the full path including prefix
  if (PUBLIC_ROUTES.some(route => req.originalUrl.startsWith(route))) {
    return next();
  }

  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const response = await fetch(`${env.authUrl}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();

    if (!data.valid) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = data.user;
    next();

  } catch (err) {
    console.error('Auth service unavailable', err);
    res.status(503).json({ error: 'Authentication service unavailable' });
  }
};
