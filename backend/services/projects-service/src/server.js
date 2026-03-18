import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { pgPool } from './config/database.js';
import { redisClient } from './config/redis.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import projectRoutes from './routes/projectRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

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