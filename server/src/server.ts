import app from './app';
import { connectMongoDB, redis } from './config/database';
import { config } from './config/env';

const startServer = async () => {
  await connectMongoDB();
  // Redis connects automatically on import instance creation

  app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port} in ${config.env} mode`);
  });
};

startServer();
