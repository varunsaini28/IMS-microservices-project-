import dotenv from 'dotenv';
dotenv.config();

const required = ['PORT', 'MONGODB_URI', 'REDIS_URL', 'RABBITMQ_URL', 'JWT_SECRET'];
required.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
});

export const env = {
  port: process.env.PORT,
  mongodbUri: process.env.MONGODB_URI,
  redisUrl: process.env.REDIS_URL,
  rabbitmqUrl: process.env.RABBITMQ_URL,
  jwtSecret: process.env.JWT_SECRET,
};