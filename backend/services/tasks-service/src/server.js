
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDB } from './config/database.js';
import { redisClient } from './config/redis.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import taskRoutes from './routes/taskRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { scheduleDeadlineReminder } from './jobs/deadlineReminder.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/tasks', taskRoutes);

app.use(errorHandler);

const PORT = env.port || 4003;
app.listen(PORT, async () => {
  console.log(`Tasks service running on port ${PORT}`);
  await connectDB();
  await redisClient;
  connectRabbitMQ().catch(console.error);
  scheduleDeadlineReminder();
});