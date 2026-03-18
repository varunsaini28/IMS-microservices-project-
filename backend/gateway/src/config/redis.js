import redis from 'redis';
import { env } from './env.js';

export const redisClient = redis.createClient({ url: env.redisUrl });

redisClient.on('error', (err) => console.error('Redis error:', err));

await redisClient.connect();
console.log('Redis connected for rate limiting');