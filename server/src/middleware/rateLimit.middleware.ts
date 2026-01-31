import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/database';

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Redis key prefix
  message?: string;      // Error message
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 100,
  keyPrefix: 'ratelimit',
  message: 'Too many requests, please try again later',
  skipFailedRequests: false
};

export const rateLimit = (config: Partial<RateLimitConfig> = {}) => {
  const options = { ...defaultConfig, ...config };
  const windowSeconds = Math.ceil(options.windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generate key based on IP or user ID
      const key = options.keyGenerator 
        ? options.keyGenerator(req)
        : `${options.keyPrefix}:${req.ip || req.socket.remoteAddress || 'unknown'}`;

      // Increment counter
      const current = await redis.incr(key);

      // Set expiry on first request
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Get TTL for headers
      const ttl = await redis.ttl(key);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - current));
      res.setHeader('X-RateLimit-Reset', Date.now() + (ttl * 1000));

      if (current > options.maxRequests) {
        res.setHeader('Retry-After', ttl);
        return res.status(429).json({ 
          error: options.message,
          retryAfter: ttl
        });
      }

      next();
    } catch (error) {
      // If Redis fails, allow the request (fail open)
      console.error('Rate limit check failed:', error);
      next();
    }
  };
};

// Preset rate limiters for common use cases
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 100,
  keyPrefix: 'api'
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 10,
  keyPrefix: 'auth',
  message: 'Too many authentication attempts, please try again in 15 minutes'
});

export const seatLockLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 20,      // Max 20 seat locks per minute per user
  keyPrefix: 'seatlock',
  message: 'Too many seat lock attempts, please slow down',
  keyGenerator: (req: Request) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    const userId = req.user?.sub || req.ip || 'unknown';
    return `seatlock:${userId}`;
  }
});

export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 5,       // Max 5 booking attempts per minute
  keyPrefix: 'booking',
  message: 'Too many booking attempts, please wait before trying again',
  keyGenerator: (req: Request) => {
    const userId = req.user?.sub || req.ip || 'unknown';
    return `booking:${userId}`;
  }
});

// Sliding window rate limiter for more precise control
export const slidingWindowRateLimit = (config: Partial<RateLimitConfig> = {}) => {
  const options = { ...defaultConfig, ...config };
  const windowSeconds = Math.ceil(options.windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = options.keyGenerator 
        ? options.keyGenerator(req)
        : `${options.keyPrefix}:sliding:${req.ip || 'unknown'}`;

      const now = Date.now();
      const windowStart = now - options.windowMs;

      // Use sorted set with timestamp as score
      const multi = redis.multi();
      
      // Remove old entries outside the window
      multi.zremrangebyscore(key, 0, windowStart);
      
      // Add current request
      multi.zadd(key, now, `${now}:${Math.random()}`);
      
      // Count requests in window
      multi.zcard(key);
      
      // Set expiry
      multi.expire(key, windowSeconds);

      const results = await multi.exec();
      const requestCount = results?.[2]?.[1] as number || 0;

      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - requestCount));

      if (requestCount > options.maxRequests) {
        return res.status(429).json({ 
          error: options.message,
          requestCount
        });
      }

      next();
    } catch (error) {
      console.error('Sliding window rate limit failed:', error);
      next();
    }
  };
};
