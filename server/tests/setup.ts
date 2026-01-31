import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import Redis from 'ioredis-mock';

let mongoServer: MongoMemoryReplSet;

// Mock Redis
jest.mock('../src/config/database', () => {
  const actualModule = jest.requireActual('../src/config/database');
  return {
    ...actualModule,
    redis: new Redis(),
    connectMongoDB: jest.fn()
  };
});

// Mock payment provider for tests
jest.mock('../src/utils/payment.provider', () => ({
  processPayment: jest.fn().mockResolvedValue('mock_payment_id'),
  processRefund: jest.fn().mockResolvedValue('mock_refund_id'),
  queueRefund: jest.fn(),
  getPaymentServiceStats: jest.fn().mockReturnValue({
    payment: { state: 'CLOSED' },
    refund: { state: 'CLOSED' }
  })
}));

beforeAll(async () => {
  // Use replica set to support transactions
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}, 60000); // Increase timeout for replica set startup

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
