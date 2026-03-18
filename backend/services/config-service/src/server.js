import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDB } from './config/database.js';
import { redisClient } from './config/redis.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import configRoutes from './routes/configRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/config', configRoutes);

app.use(errorHandler);

const PORT = env.port || 4004;
app.listen(PORT, async () => {
  console.log(`Config service running on port ${PORT}`);
  await connectDB();
  await redisClient;
  connectRabbitMQ().catch(console.error);
});