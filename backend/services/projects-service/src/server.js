import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { pgPool } from './config/database.js';
import { redisClient } from './config/redis.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import projectRoutes from './routes/projectRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import crypto from 'crypto';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  const start = Date.now();
  res.on('finish', () => {
    console.log(
      JSON.stringify({
        level: 'info',
        msg: 'projects_service_request',
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl || req.path,
        status: res.statusCode,
        durationMs: Date.now() - start,
      })
    );
  });
  next();
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/projects', projectRoutes);

app.use(errorHandler);

const PORT = env.port || 4005;
app.listen(PORT, async () => {
  console.log(`Projects service running on port ${PORT}`);
  try {
    await pgPool.query('SELECT 1');
    console.log('PostgreSQL connected');
  } catch (err) {
    console.error('PostgreSQL connection error', err);
  }
  await redisClient;
  connectRabbitMQ().catch(console.error);
});