import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME || 'AI Voice Agent',
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  throttleTtl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
}));

export const databaseConfig = registerAs('database', () => ({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-voice-agent',
  name: 'ai-voice-agent',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'fallback_secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback_refresh_secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
}));

export const sarvamConfig = registerAs('sarvam', () => ({
  apiKey: process.env.SARVAM_API_KEY,
  apiUrl: process.env.SARVAM_API_URL || 'https://api.sarvam.ai/v1',
}));

export const telephonyConfig = registerAs('telephony', () => ({
  provider: process.env.TELEPHONY_PROVIDER || 'mock',
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    studioFlowSid: process.env.TWILIO_STUDIO_FLOW_SID,
  },
  telnyx: {
    apiKey: process.env.TELNYX_API_KEY,
    connectionId: process.env.TELNYX_CONNECTION_ID,
    phoneNumber: process.env.TELNYX_PHONE_NUMBER,
  },
}));
