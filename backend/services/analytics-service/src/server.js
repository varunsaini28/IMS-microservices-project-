import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { pgPool } from './config/database.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/analytics', analyticsRoutes);
app.use(errorHandler);

const PORT = env.port || 4007;
app.listen(PORT, async () => {
  console.log(`Analytics service running on port ${PORT}`);
  try {
    await pgPool.query('SELECT 1');
    console.log('PostgreSQL connected');
  } catch (err) {
    console.error('PostgreSQL connection error', err);
  }
  await connectRabbitMQ();
});