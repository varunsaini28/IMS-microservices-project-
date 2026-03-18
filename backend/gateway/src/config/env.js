import dotenv from 'dotenv';
dotenv.config();

const required = ['PORT', 'REDIS_URL', 'AUTH_SERVICE_URL', 'FRONTEND_URL'];
required.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
});

export const env = {
  port: process.env.PORT,
  redisUrl: process.env.REDIS_URL,
  authUrl: process.env.AUTH_SERVICE_URL,
  internUrl: process.env.INTERN_SERVICE_URL,
  tasksUrl: process.env.TASKS_SERVICE_URL,
  configUrl: process.env.CONFIG_SERVICE_URL,
  projectsUrl: process.env.PROJECTS_SERVICE_URL,
  notificationUrl: process.env.NOTIFICATION_SERVICE_URL,
  analyticsUrl: process.env.ANALYTICS_SERVICE_URL,
  auditUrl: process.env.AUDIT_SERVICE_URL,
  frontendUrl: process.env.FRONTEND_URL,
};