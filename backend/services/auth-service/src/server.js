// import express from 'express';
// import cors from 'cors';
// import { env } from './config/env.js';
// import { pgPool } from './config/database.js';
// import { redisClient } from './config/redis.js';
// import { connectRabbitMQ } from './config/rabbitmq.js';
// import authRoutes from './routes/authRoutes.js';
// import { errorHandler } from './middleware/errorHandler.js';

// const app = express();

// // Middleware
// // app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3001', credentials: true }));

// app.use(cors({
//   origin: (origin, callback) => {
//     // allow all origins in dev
//     callback(null, true);
//   },
//   credentials: true,
// }));


// app.use(express.json());

// // Health check
// app.get('/health', (req, res) => res.json({ status: 'ok' }));

// // Routes
// app.use('/auth', authRoutes);

// // Error handling
// app.use(errorHandler);

// // Start server
// const PORT = env.port || 4001;
// app.listen(PORT, async () => {
//   console.log(`Auth service running on port ${PORT}`);
//   // Ensure connections are alive (they are already initiated in their modules)
//   try {
//      // test connection
//     await pgPool.query("SELECT 1");
//     console.log('PostgreSQL connected');
//   } catch (err) {
//     console.error('PostgreSQL connection failed', err);
//   }
//   await redisClient; // already connected
//   connectRabbitMQ().catch(err => console.error('Initial RabbitMQ connection failed:', err.message));
// });


import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { pgPool } from './config/database.js';
import { redisClient } from './config/redis.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// // ─── CORS — allowed origins come from .env ────────────────
// const allowedOrigins = env.allowedOrigins
//   ? env.allowedOrigins.split(',').map(o => o.trim())
//   : [];

// app.use(cors({
//   origin: (origin, callback) => {
//     // Allow requests with no origin (curl, mobile apps, server-to-server)
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.includes(origin)) return callback(null, true);
//     callback(new Error(`CORS: origin ${origin} not allowed`));
//   },
//   credentials: true,
// }));


app.use(cors({
  origin: true,        // sab origins allow
  credentials: true,
}));


app.use(express.json());

// ─── Health check ─────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ─── Routes ───────────────────────────────────────────────
app.use('/auth', authRoutes);

// ─── Error handler ────────────────────────────────────────
app.use(errorHandler);

// ─── Boot ─────────────────────────────────────────────────
const PORT = env.port || 4001;
app.listen(PORT, async () => {
  console.log(`Auth service running on port ${PORT}`);

  try {
    await pgPool.query('SELECT 1');
    console.log('PostgreSQL connected');
  } catch (err) {
    console.error('PostgreSQL connection failed:', err.message);
  }

  connectRabbitMQ().catch(err =>
    console.error('Initial RabbitMQ connection failed:', err.message)
  );
});