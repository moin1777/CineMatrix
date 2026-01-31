import { Router } from 'express';
import * as UserController from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';

const router = Router();

// ============ USER PROFILE ROUTES ============
router.get('/profile', authenticate, UserController.getProfile);
router.put('/profile', authenticate, UserController.updateProfile);
router.post('/change-password', authenticate, UserController.changePassword);

// ============ BOOKING HISTORY ROUTES ============
router.get('/bookings', authenticate, UserController.getBookingHistory);
router.get('/bookings/:bookingId', authenticate, UserController.getBookingDetails);
router.get('/stats', authenticate, UserController.getUserStats);

// ============ ADMIN USER MANAGEMENT ROUTES ============
router.get('/', authenticate, requireAdmin, UserController.getAllUsers);
router.get('/:id', authenticate, requireAdmin, UserController.getUserById);
router.put('/:id/role', authenticate, requireAdmin, UserController.updateUserRole);
router.delete('/:id', authenticate, requireAdmin, UserController.deleteUser);

export default router;
