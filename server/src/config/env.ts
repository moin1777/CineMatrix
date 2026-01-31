import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/cinematrix',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwt: {
    accessPrivateKey: process.env.ACCESS_TOKEN_PRIVATE_KEY || '',
    accessPublicKey: process.env.ACCESS_TOKEN_PUBLIC_KEY || '',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
    accessExpiration: '15m', // 15 minutes
    refreshExpiration: '7d', // 7 days
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3001'
};

if (!config.jwt.accessPrivateKey || !config.jwt.accessPublicKey) {
  console.warn("WARNING: RS256 keys not set in environment. Access tokens may fail if not just testing.");
}
