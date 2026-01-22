import { Router } from 'express';
import * as BookingController from './booking.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { idempotency } from '../../middleware/idempotency.middleware';

const router = Router();

router.post('/lock', authenticate, BookingController.lockSeat);
router.post('/confirm', authenticate, idempotency, BookingController.confirmBooking);

export default router;
