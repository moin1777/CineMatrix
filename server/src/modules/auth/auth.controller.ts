import { Request, Response } from 'express';
import * as AuthService from './auth.service';
import { setRefreshCookie, verifyRefreshToken, clearRefreshCookie } from './auth.utils';
import { registerSchema, loginSchema } from './auth.validation';

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const result = await AuthService.registerUser(parsed.data);

    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({
      user: { id: result.user._id, email: result.user.email, name: result.user.name, role: result.user.role },
      accessToken: result.accessToken
    });
  } catch (error: any) {
    if (error.message === 'User already exists') {
      return res.status(409).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const result = await AuthService.loginUser(parsed.data);

    setRefreshCookie(res, result.refreshToken);
    res.json({
      user: { id: result.user._id, email: result.user.email, name: result.user.name, role: result.user.role },
      accessToken: result.accessToken
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies.refresh_token; // Relies on cookie-parser

  if (!token) return res.status(401).json({ error: 'No refresh token' });

  const payload = verifyRefreshToken(token);
  if (!payload) return res.status(403).json({ error: 'Invalid refresh token' });

  // In a robust system, we would also:
  // 1. Check if token is in a deny-list (revocation)
  // 2. Check if user still exists/is active

  const result = AuthService.rotateTokens(payload);

  // Note: If we were doing Refresh Token Rotation, we would issue a new one here and set cookie.
  // For now, simple rotation of Access Token.

  res.json({ accessToken: result.accessToken });
};

export const logout = (req: Request, res: Response) => {
  clearRefreshCookie(res);
  res.json({ message: 'Logged out' });
};
