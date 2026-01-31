import { redis as redisClient } from '../../config/database';
import { Show } from '../event/show.model';
import { Booking, IBooking } from './booking.model';
import { User } from '../auth/user.model';
import { Hall } from '../venue/venue.model';
import { processRefund, queueRefund } from '../../utils/payment.provider';
import mongoose from 'mongoose';

const LOCK_TTL_SECONDS = 300; // 5 minutes

// ============ SEAT LOCKING ============

export const lockSeat = async (showId: string, seatId: string, userId?: string): Promise<boolean> => {
  const key = `seat_lock:${showId}:${seatId}`;
  const result = await redisClient.set(key, userId || 'LOCKED', 'EX', LOCK_TTL_SECONDS, 'NX');
  return result === 'OK';
};

export const lockMultipleSeats = async (showId: string, seatIds: string[], userId?: string): Promise<{
  locked: string[];
  failed: string[];
}> => {
  const locked: string[] = [];
  const failed: string[] = [];

  // First check if any seat is already booked in DB
  const show = await Show.findById(showId);
  if (!show) throw new Error('Show not found');

  const alreadyBooked = seatIds.filter(seat => show.bookedSeats.includes(seat));
  if (alreadyBooked.length > 0) {
    return { locked: [], failed: seatIds };
  }

  // Try to lock all seats atomically using Redis MULTI
  const multi = redisClient.multi();
  
  for (const seatId of seatIds) {
    const key = `seat_lock:${showId}:${seatId}`;
    multi.set(key, userId || 'LOCKED', 'EX', LOCK_TTL_SECONDS, 'NX');
  }

  const results = await multi.exec();
  
  if (results) {
    for (let i = 0; i < seatIds.length; i++) {
      if (results[i][1] === 'OK') {
        locked.push(seatIds[i]);
      } else {
        failed.push(seatIds[i]);
      }
    }
  }

  // If not all seats were locked, release the ones we did lock
  if (failed.length > 0 && locked.length > 0) {
    await Promise.all(locked.map(seat => unlockSeat(showId, seat)));
    return { locked: [], failed: seatIds };
  }

  return { locked, failed };
};

export const unlockSeat = async (showId: string, seatId: string): Promise<void> => {
  const key = `seat_lock:${showId}:${seatId}`;
  await redisClient.del(key);
};

export const unlockMultipleSeats = async (showId: string, seatIds: string[]): Promise<void> => {
  const keys = seatIds.map(seatId => `seat_lock:${showId}:${seatId}`);
  if (keys.length > 0) {
    await redisClient.del(...keys);
  }
};

export const getSeatLockStatus = async (showId: string, seatId: string): Promise<{ isLocked: boolean; ttl: number }> => {
  const key = `seat_lock:${showId}:${seatId}`;
  const [exists, ttl] = await Promise.all([
    redisClient.exists(key),
    redisClient.ttl(key)
  ]);
  return { isLocked: exists === 1, ttl: ttl > 0 ? ttl : 0 };
};

export const extendSeatLock = async (showId: string, seatId: string, additionalSeconds: number = 300): Promise<boolean> => {
  const key = `seat_lock:${showId}:${seatId}`;
  const exists = await redisClient.exists(key);
  if (!exists) return false;
  
  await redisClient.expire(key, additionalSeconds);
  return true;
};

// ============ BOOKING CONFIRMATION ============

export const confirmBooking = async (userId: string, showId: string, seats: string[], paymentId: string): Promise<IBooking> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const show = await Show.findById(showId).session(session);
    if (!show) throw new Error('Show not found');

    // Check show hasn't started
    if (new Date() > show.startTime) {
      throw new Error('Show has already started');
    }

    const alreadyBooked = seats.some(seat => show.bookedSeats.includes(seat));
    if (alreadyBooked) {
      throw new Error('One or more seats are already booked');
    }

    // Get seat prices from hall if available
    let totalAmount = show.price * seats.length;
    try {
      const hall = await Hall.findById(show.hallId).session(session);
      if (hall && hall.seatMap) {
        totalAmount = 0;
        for (const seatId of seats) {
          const seatConfig = hall.seatMap.find(s => `${s.row}${s.number}` === seatId);
          totalAmount += seatConfig?.price || show.price;
        }
      }
    } catch (e) {
      // If hall not found, use show price
    }

    const booking = new Booking({
      userId,
      showId,
      seats,
      totalAmount,
      status: 'CONFIRMED',
      paymentId
    });
    await booking.save({ session });

    show.bookedSeats.push(...seats);
    await show.save({ session });

    await User.findByIdAndUpdate(userId, {
      $push: { history: { bookingId: booking._id, bookedAt: new Date(), showId: show._id } }
    }, { session });

    await session.commitTransaction();

    Promise.all(seats.map(seat => unlockSeat(showId, seat))).catch(err => 
      console.error('Failed to unlock seats after booking:', err)
    );

    return booking;

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ============ BOOKING CANCELLATION ============

export const cancelBooking = async (userId: string, bookingId: string, reason?: string): Promise<IBooking> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findOne({ _id: bookingId, userId }).session(session);
    if (!booking) throw new Error('Booking not found');

    if (booking.status === 'CANCELLED') {
      throw new Error('Booking is already cancelled');
    }

    const show = await Show.findById(booking.showId).session(session);
    if (!show) throw new Error('Show not found');

    const now = new Date();
    const showTime = new Date(show.startTime);
    const hoursUntilShow = (showTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilShow < 2) {
      throw new Error('Cannot cancel booking within 2 hours of show time');
    }

    let refundAmount = booking.totalAmount;
    if (hoursUntilShow < 24) {
      refundAmount = booking.totalAmount * 0.5;
    }

    booking.status = 'CANCELLED';
    booking.cancelledAt = now;
    booking.cancellationReason = reason;
    booking.refundAmount = refundAmount;
    await booking.save({ session });

    show.bookedSeats = show.bookedSeats.filter(seat => !booking.seats.includes(seat));
    await show.save({ session });

    await User.findByIdAndUpdate(userId, {
      $pull: { history: { bookingId: booking._id } }
    }, { session });

    await session.commitTransaction();

    if (booking.paymentId && refundAmount > 0) {
      processRefund(booking.paymentId, refundAmount).catch(err => {
        console.error('Immediate refund failed, queuing:', err);
        queueRefund({
          paymentId: booking.paymentId!,
          amount: refundAmount,
          bookingId: booking._id.toString(),
          userId,
          reason: reason || 'Customer cancellation'
        });
      });
    }

    return booking;

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ============ BOOKING QUERIES ============

export const getBookingById = async (bookingId: string): Promise<IBooking | null> => {
  return Booking.findById(bookingId)
    .populate({
      path: 'showId',
      select: 'startTime hallId eventId price',
      populate: [
        { path: 'eventId', select: 'title posterUrl durationMinutes' },
        { path: 'hallId', select: 'name venueId', populate: { path: 'venueId', select: 'name city address' } }
      ]
    })
    .populate('userId', 'email');
};

export const getBookingsByShow = async (showId: string): Promise<IBooking[]> => {
  return Booking.find({ showId, status: { $ne: 'CANCELLED' } })
    .populate('userId', 'email')
    .sort({ createdAt: -1 });
};

export const getActiveBookingsCount = async (showId: string): Promise<number> => {
  return Booking.countDocuments({ showId, status: { $in: ['PENDING', 'CONFIRMED'] } });
};

// ============ ADMIN BOOKING MANAGEMENT ============

interface BookingFilters {
  status?: string;
  showId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export const getAllBookings = async (filters: BookingFilters = {}) => {
  const query: any = {};
  
  if (filters.status) query.status = filters.status;
  if (filters.showId) query.showId = filters.showId;
  if (filters.userId) query.userId = filters.userId;
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
    if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('userId', 'email')
      .populate({
        path: 'showId',
        select: 'startTime eventId',
        populate: { path: 'eventId', select: 'title' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(query)
  ]);

  return {
    bookings,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

export const getBookingStats = async () => {
  const [
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    totalRevenue,
    todayBookings
  ] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'CONFIRMED' }),
    Booking.countDocuments({ status: 'CANCELLED' }),
    Booking.aggregate([
      { $match: { status: 'CONFIRMED' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Booking.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    })
  ]);

  return {
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    totalRevenue: totalRevenue[0]?.total || 0,
    todayBookings
  };
};
