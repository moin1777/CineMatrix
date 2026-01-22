import { User } from './user.model';
import { signAccessToken, signRefreshToken } from './auth.utils';
import { Request } from 'express';

// DTOs (Data Transfer Objects) could be defined here or separately, handling inline for now
interface RegisterInput {
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await User.findOne({ email: input.email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const user = await User.create(input);

  // Issue tokens immediately? Or require login?
  // Let's issue tokens for better UX
  const payload = { sub: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { user, accessToken, refreshToken };
};

export const loginUser = async (input: LoginInput) => {
  const user = await User.findOne({ email: input.email }).select('+password');
  if (!user || !(await user.comparePassword(input.password))) {
    throw new Error('Invalid credentials');
  }

  const payload = { sub: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { user, accessToken, refreshToken };
};

export const rotateTokens = (validPayload: { sub: string, role: string }) => {
  // Rotate logic: Issue NEW Access Token. 
  // Can also Rotate Refresh Token (strict security) or Keep it.
  // Requirement says: "issues a new Access Token".
  // Optionally, we can issue a new Refresh Token too if we want to defer expiry.
  // Let's just issue a new Access Token for now.
  const newAccessToken = signAccessToken({ sub: validPayload.sub, role: validPayload.role });
  return { accessToken: newAccessToken };
};
