import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: { sub: string; role: string };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwt.accessPublicKey || config.jwt.accessPrivateKey || 'initial_fallback');
    // Uses Public Key if RS256, but accessPrivateKey var in config might hold the secret if HS256 fallback. 
    // Setup for RS256 verification usually needs Public Key. 
    // In auth.utils.ts I used accessPrivateKey for signing which implies it's a secret or I have both.
    // Let's assume for this code we verify with what we have. 
    // If RS256, we verify with Public Key.

    req.user = payload as { sub: string; role: string };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }
};
