import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { env } from './config/env.js';
import { limiter } from './config/rateLimit.js';
import { verifyJwt } from './middleware/jwtVerifier.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// app.use(cors({ origin: env.frontendUrl, credentials: true }));

app.use(cors({
  origin: (origin, callback) => {
    // Sab origin allow karne ke liye development me
    callback(null, true);
  },
  credentials: true,
}));

app.use(limiter);
app.use(verifyJwt);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const makeProxy = (target) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl, // ✅ keep full original path
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader('X-User-Id', req.user.id ?? '');
          proxyReq.setHeader('X-User-Role', req.user.role ?? '');
        }
      },
      error: (err, req, res) => {
        console.error(`Proxy error for ${req.path}:`, err.message);
        res.status(502).json({ error: 'Service unavailable' });
      }
    }
  });

// ✅ use app.use directly - not router
app.use('/auth',          makeProxy(env.authUrl));
app.use('/intern',        makeProxy(env.internUrl));
app.use('/tasks',         makeProxy(env.tasksUrl));
app.use('/config',        makeProxy(env.configUrl));
app.use('/projects',      makeProxy(env.projectsUrl));
app.use('/notifications', makeProxy(env.notificationUrl));
app.use('/analytics',     makeProxy(env.analyticsUrl));
app.use('/audit',         makeProxy(env.auditUrl));

app.use(errorHandler);

app.listen(env.port || 5000, () => {
  console.log(`Gateway running on port ${env.port}`);
});