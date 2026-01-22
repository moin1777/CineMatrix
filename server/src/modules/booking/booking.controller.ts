import { Request, Response } from 'express';
import * as BookingService from './booking.service';
import { Show } from '../event/show.model';
import { processPayment } from '../../utils/payment.provider';

export const lockSeat = async (req: Request, res: Response) => {
  try {
    const { showId, seatId } = req.body;
    if (!showId || !seatId) return res.status(400).json({ error: 'Missing showId or seatId' });

    const success = await BookingService.lockSeat(showId, seatId);
    if (!success) {
      return res.status(409).json({ error: 'Seat is currently locked by another user' });
    }

    res.json({ message: 'Seat locked', showId, seatId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const confirmBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { showId, seats, paymentToken } = req.body;
    if (!showId || !seats || !seats.length || !paymentToken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Fetch Show for Price
    const show = await Show.findById(showId);
    if (!show) return res.status(404).json({ error: 'Show not found' });

    // 2. Process Payment (Circuit Breaker)
    const totalAmount = show.price * seats.length;
    let paymentId;
    try {
      paymentId = await processPayment(totalAmount, paymentToken);
    } catch (paymentError: any) {
      return res.status(503).json({ error: 'Payment failed or service unavailable', details: paymentError.message });
    }

    // 3. Confirm Transaction
    try {
      const booking = await BookingService.confirmBooking(userId, showId, seats, paymentId);
      res.status(201).json({ booking });
    } catch (bookingError: any) {
      // In a real system, initiate Refund logic here for paymentId
      console.error('Booking failed after payment, needing refund:', paymentId);
      return res.status(500).json({ error: 'Booking failed', details: bookingError.message });
    }

  } catch (error: any) {
    console.error(error);
    if (error.message === 'One or more seats are already booked') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
