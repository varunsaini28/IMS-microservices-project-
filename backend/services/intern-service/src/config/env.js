import dotenv from 'dotenv';
dotenv.config();

const required = ['PORT', 'DATABASE_URL', 'REDIS_URL', 'RABBITMQ_URL', 'JWT_SECRET','RABBITMQ_HOST'];
required.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
});

export const env = {
  port: process.env.PORT,
  dbUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  rabbitmqUrl: process.env.RABBITMQ_URL,
  jwtSecret: process.env.JWT_SECRET,
  rabbitmqHost: process.env.RABBITMQ_HOST || '',
};