import dotenv from "dotenv";
dotenv.config();

const requiredEnv=[
   'PORT',
  'DATABASE_URL',
  'REDIS_URL',
  'RABBITMQ_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'RABBITMQ_HOST'
]

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

export const env = {
  port: process.env.PORT,
  dbUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  rabbitmqUrl: process.env.RABBITMQ_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  rabbitmqHost: process.env.RABBITMQ_HOST || '',
  internalApiKey: process.env.INTERNAL_API_KEY || '',
};