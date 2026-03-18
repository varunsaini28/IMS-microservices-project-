import dotenv from 'dotenv';
dotenv.config();

const required = ['PORT', 'MONGODB_URI', 'REDIS_URL', 'RABBITMQ_URL', 'JWT_SECRET', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
required.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
});

export const env = {
  port: process.env.PORT,
  mongodbUri: process.env.MONGODB_URI,
  redisUrl: process.env.REDIS_URL,
  rabbitmqUrl: process.env.RABBITMQ_URL,
  jwtSecret: process.env.JWT_SECRET,
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM
  }
};