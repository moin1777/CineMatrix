import { User } from './user.model';
import { signAccessToken, signRefreshToken } from './auth.utils';
import { Request } from 'express';

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await User.findOne({ email: input.email.toLowerCase() });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const user = await User.create({
    email: input.email.toLowerCase(),
    password: input.password,
    name: input.name
  });

  const payload = { sub: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { user, accessToken, refreshToken };
};

export const loginUser = async (input: LoginInput) => {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(input.password))) {
    throw new Error('Invalid credentials');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  const payload = { sub: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { user, accessToken, refreshToken };
};

export const rotateTokens = (validPayload: { sub: string, role: string }) => {
  const newAccessToken = signAccessToken({ sub: validPayload.sub, role: validPayload.role });
  return { accessToken: newAccessToken };
};
