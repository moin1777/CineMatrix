import { Request, Response } from 'express';
import * as BookingService from './booking.service';
import { Show } from '../event/show.model';
import { processPayment } from '../../utils/payment.provider';
import { lockSeatSchema, lockMultipleSeatsSchema, confirmBookingSchema, cancelBookingSchema } from './booking.validation';

// ============ SEAT LOCKING ============

export const lockSeat = async (req: Request, res: Response) => {
  try {
    const parsed = lockSeatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { showId, seatId } = parsed.data;
    const userId = req.user?.sub;

    const success = await BookingService.lockSeat(showId, seatId, userId);
    if (!success) {
      return res.status(409).json({ error: 'Seat is currently locked by another user' });
    }

    res.json({ message: 'Seat locked successfully', showId, seatId, expiresIn: 300 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const lockMultipleSeats = async (req: Request, res: Response) => {
  try {
    const parsed = lockMultipleSeatsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { showId, seatIds } = parsed.data;
    const userId = req.user?.sub;

    const result = await BookingService.lockMultipleSeats(showId, seatIds, userId);
    
    if (result.failed.length > 0) {
      return res.status(409).json({ 
        error: 'Some seats could not be locked',
        locked: result.locked,
        failed: result.failed
      });
    }

    res.json({ 
      message: 'All seats locked successfully', 
      showId, 
      seats: result.locked,
      expiresIn: 300 
    });
  } catch (error: any) {
    if (error.message === 'Show not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const unlockSeat = async (req: Request, res: Response) => {
  try {
    const { showId, seatId } = req.body;
    if (!showId || !seatId) {
      return res.status(400).json({ error: 'Missing showId or seatId' });
    }

    await BookingService.unlockSeat(showId, seatId);
    res.json({ message: 'Seat unlocked successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSeatLockStatus = async (req: Request, res: Response) => {
  try {
    const showId = req.params.showId as string;
    const seatId = req.params.seatId as string;
    const status = await BookingService.getSeatLockStatus(showId, seatId);
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const extendSeatLock = async (req: Request, res: Response) => {
  try {
    const { showId, seatId } = req.body;
    if (!showId || !seatId) {
      return res.status(400).json({ error: 'Missing showId or seatId' });
    }

    const success = await BookingService.extendSeatLock(showId, seatId);
    if (!success) {
      return res.status(404).json({ error: 'Lock not found or expired' });
    }

    res.json({ message: 'Lock extended successfully', expiresIn: 300 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ============ BOOKING CONFIRMATION ============

export const confirmBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = confirmBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { showId, seats, paymentToken } = parsed.data;

    // 1. Fetch Show for Price
    const show = await Show.findById(showId);
    if (!show) return res.status(404).json({ error: 'Show not found' });

    // 2. Process Payment (Circuit Breaker protected)
    const totalAmount = show.price * seats.length;
    let paymentId;
    try {
      paymentId = await processPayment(totalAmount, paymentToken);
    } catch (paymentError: any) {
      // Release locked seats on payment failure
      await BookingService.unlockMultipleSeats(showId, seats);
      return res.status(503).json({ 
        error: 'Payment failed or service unavailable', 
        details: paymentError.message 
      });
    }

    // 3. Confirm Transaction
    try {
      const booking = await BookingService.confirmBooking(userId, showId, seats, paymentId);
      res.status(201).json({ 
        message: 'Booking confirmed successfully',
        booking: {
          id: booking._id,
          seats: booking.seats,
          totalAmount: booking.totalAmount,
          status: booking.status,
          paymentId: booking.paymentId
        }
      });
    } catch (bookingError: any) {
      console.error('Booking failed after payment, initiating refund:', paymentId);
      return res.status(500).json({ 
        error: 'Booking failed', 
        details: bookingError.message,
        paymentId,
        message: 'A refund has been initiated'
      });
    }

  } catch (error: any) {
    console.error('Booking error:', error);
    if (error.message === 'One or more seats are already booked') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// ============ BOOKING CANCELLATION ============

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const bookingId = req.params.bookingId as string;
    const parsed = cancelBookingSchema.safeParse(req.body);
    const reason = parsed.success ? parsed.data.reason : undefined;

    const booking = await BookingService.cancelBooking(userId, bookingId, reason);
    
    res.json({ 
      message: 'Booking cancelled successfully',
      booking: {
        id: booking._id,
        status: booking.status,
        refundAmount: booking.refundAmount,
        refundStatus: 'processing'
      }
    });
  } catch (error: any) {
    if (error.message === 'Booking not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('already cancelled') || error.message.includes('within 2 hours')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// ============ BOOKING QUERIES ============

export const getBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    const isAdmin = req.user?.role === 'admin';
    
    const booking = await BookingService.getBookingById(req.params.id as string);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only allow users to see their own bookings (unless admin)
    if (!isAdmin && booking.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    res.json({ booking });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ============ ADMIN CONTROLLERS ============

export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const { status, showId, userId, dateFrom, dateTo, page, limit } = req.query;
    
    const result = await BookingService.getAllBookings({
      status: status as string,
      showId: showId as string,
      userId: userId as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBookingStats = async (req: Request, res: Response) => {
  try {
    const stats = await BookingService.getBookingStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBookingsByShow = async (req: Request, res: Response) => {
  try {
    const bookings = await BookingService.getBookingsByShow(req.params.showId as string);
    res.json({ bookings, count: bookings.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
