import jwt from 'jsonwebtoken';
import { Response, CookieOptions } from 'express';
import { config } from '../../config/env';

// Cookie Options
const REFRESH_COOKIE_NAME = 'refresh_token';
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: config.env === 'production', // true in production
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/' // accessible on all routes needed (or restrict to /auth/refresh)
};

// Types
interface TokenPayload {
  sub: string;
  role: string;
}

// Utils
export const signAccessToken = (payload: TokenPayload): string => {
  try {
    return jwt.sign(payload, config.jwt.accessPrivateKey as jwt.Secret, {
      expiresIn: config.jwt.accessExpiration,
      algorithm: 'RS256',
    } as any);
  } catch (error) {
    console.warn("Failed to sign with RS256, falling back to HS256. (Ensure keys are set in .env)");
    return jwt.sign(payload, 'FALLBACK_SECRET_DO_NOT_USE_IN_PROD' as jwt.Secret, { expiresIn: '15m' } as any);
  }
};

export const signRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret as jwt.Secret, {
    expiresIn: config.jwt.refreshExpiration,
  } as any);
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
  } catch (error) {
    return null;
  }
};

export const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE_NAME, token, COOKIE_OPTIONS);
};

export const clearRefreshCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, COOKIE_OPTIONS);
};
