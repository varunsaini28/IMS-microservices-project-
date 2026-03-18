import redis from 'redis';
import { env } from './env.js';

export const redisClient = redis.createClient({ url: env.redisUrl });

redisClient.on('error', (err) => {
  console.error('Redis client error:', err.message);
  // Don't crash, just log
});

await redisClient.connect();
console.log('Redis connected for rate limiting');