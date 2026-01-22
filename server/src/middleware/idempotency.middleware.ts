import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/database';

export const idempotency = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['idempotency-key'];
  if (!key) return next();

  const redisKey = `idempotency:${key}`;
  const cached = await redis.get(redisKey);

  if (cached) {
    const { status, body } = JSON.parse(cached);
    return res.status(status).json(body);
  }

  // Intercept response to cache it
  const originalJson = res.json;
  res.json = function (body) {
    // Determine status (default 200 if not set)
    const statusCode = res.statusCode || 200;

    // Only cache successful or specific client errors? Usually cache all non-5xx for idempotency.
    // Let's cache 2xx and 4xx.
    if (statusCode < 500) {
      redis.set(redisKey, JSON.stringify({ status: statusCode, body }), 'EX', 60 * 60 * 24); // 24 hours
    }

    return originalJson.call(this, body);
  };

  next();
};
