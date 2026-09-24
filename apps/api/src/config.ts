import 'dotenv/config';

export const config = {
  apiPort: Number(process.env.API_PORT ?? 3001),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/demo_auth_rbac',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-for-local-demo',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
};
