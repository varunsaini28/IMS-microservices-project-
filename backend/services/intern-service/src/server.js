import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { pgPool } from './config/database.js';
import { redisClient } from './config/redis.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import internRoutes from './routes/internRoutes.js';
import { errorHandler } from './middleware/errorHandler.js'; // create simple error handler

const app = express();

// app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));

app.use(cors({
  origin: (origin, callback) => {
    // allow all origins in dev
    callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/intern', internRoutes);

app.use(errorHandler);

const PORT = env.port || 4002;
app.listen(PORT, async () => {
  console.log(`Intern service running on port ${PORT}`);
  try {
    await pgPool.query('SELECT 1');
    console.log('PostgreSQL connected');
  } catch (err) {
    console.error('PostgreSQL connection error', err);
  }
  await redisClient;
  connectRabbitMQ().catch(console.error);
});