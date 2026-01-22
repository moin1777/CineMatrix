import mongoose from 'mongoose';
import Redis from 'ioredis';
import { config } from './env';

// MongoDB Connection
export const connectMongoDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Redis Client
export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null, // Required for some advanced use cases/bullmq if used later
  enableReadyCheck: true,
});

redis.on('connect', () => console.log('✅ Redis Connected'));
redis.on('error', (err) => console.error('❌ Redis Error:', err));
