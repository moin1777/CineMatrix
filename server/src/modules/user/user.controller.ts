import { Request, Response } from 'express';
import * as UserService from './user.service';
import { changePasswordSchema, updateProfileSchema } from '../auth/auth.validation';

// ============ USER PROFILE CONTROLLERS ============

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await UserService.getUserProfile(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const user = await UserService.updateUserProfile(userId, parsed.data);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    await UserService.changePassword(userId, parsed.data.currentPassword, parsed.data.newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// ============ BOOKING HISTORY CONTROLLERS ============

export const getBookingHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { status, page, limit } = req.query;
    const history = await UserService.getUserBookingHistory(userId, {
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBookingDetails = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const booking = await UserService.getBookingDetails(userId, req.params.bookingId as string);
    res.json({ booking });
  } catch (error: any) {
    if (error.message === 'Booking not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const stats = await UserService.getUserStats(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ============ ADMIN USER MANAGEMENT CONTROLLERS ============

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { role, search, page, limit } = req.query;
    const result = await UserService.getAllUsers({
      role: role as string,
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await UserService.getUserById(req.params.id as string);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await UserService.updateUserRole(req.params.id as string, role);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await UserService.deleteUser(req.params.id as string);
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    if (error.message.includes('active bookings')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};
