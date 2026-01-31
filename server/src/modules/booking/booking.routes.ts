import { Router } from 'express';
import * as BookingController from './booking.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import { idempotency } from '../../middleware/idempotency.middleware';
import { seatLockLimiter, bookingLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

// ============ SEAT LOCKING (Requires Authentication) ============
router.post('/lock', authenticate, seatLockLimiter, BookingController.lockSeat);
router.post('/lock-multiple', authenticate, seatLockLimiter, BookingController.lockMultipleSeats);
router.post('/unlock', authenticate, BookingController.unlockSeat);
router.post('/extend-lock', authenticate, BookingController.extendSeatLock);
router.get('/lock-status/:showId/:seatId', authenticate, BookingController.getSeatLockStatus);

// ============ BOOKING OPERATIONS ============
router.post('/confirm', authenticate, bookingLimiter, idempotency, BookingController.confirmBooking);
router.post('/:bookingId/cancel', authenticate, BookingController.cancelBooking);
router.get('/:id', authenticate, BookingController.getBooking);

// ============ ADMIN ROUTES ============
router.get('/', authenticate, requireAdmin, BookingController.getAllBookings);
router.get('/stats/overview', authenticate, requireAdmin, BookingController.getBookingStats);
router.get('/show/:showId', authenticate, requireAdmin, BookingController.getBookingsByShow);

export default router;
