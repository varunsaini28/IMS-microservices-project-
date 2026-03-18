import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDB } from './config/database.js';
import { redisClient } from './config/redis.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import auditRoutes from './routes/auditRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/audit', auditRoutes);

app.use(errorHandler);

const PORT = env.port || 4008;
app.listen(PORT, async () => {
  console.log(`Audit service running on port ${PORT}`);
  await connectDB();
  await redisClient;
  await connectRabbitMQ(); // Start consuming events
});