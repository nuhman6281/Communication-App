import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  PORT: parseInt(process.env.REALTIME_PORT || '4000'),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:3000',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',

  // Redis
  REDIS_ENABLED: process.env.REDIS_ENABLED === 'true',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

  // TURN/STUN
  TURN_ENABLED: process.env.TURN_ENABLED === 'true',
  TURN_SERVER_URL: process.env.TURN_SERVER_URL || 'turn:localhost:3478',
  TURN_USERNAME: process.env.TURN_USERNAME || 'username',
  TURN_PASSWORD: process.env.TURN_PASSWORD || 'password',
  STUN_SERVER_URL: process.env.STUN_SERVER_URL || 'stun:stun.l.google.com:19302',

  // Limits
  MAX_PARTICIPANTS_PER_CALL: parseInt(process.env.MAX_PARTICIPANTS_PER_CALL || '50'),
  CALL_TIMEOUT_MS: parseInt(process.env.CALL_TIMEOUT_MS || '3600000'), // 1 hour

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};