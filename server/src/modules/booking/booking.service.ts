import { redis, redis as redisClient } from '../../config/database'; // Use the exported instance
import { Show } from '../event/show.model';
import { Booking } from './booking.model';
import { User } from '../auth/user.model';
import mongoose from 'mongoose';

const LOCK_TTL_SECONDS = 300; // 5 minutes

export const lockSeat = async (showId: string, seatId: string): Promise<boolean> => {
  const key = `seat_lock:${showId}:${seatId}`;
  // SET key value NX EX 300
  const result = await redisClient.set(key, 'LOCKED', 'EX', LOCK_TTL_SECONDS, 'NX');
  return result === 'OK';
};

export const unlockSeat = async (showId: string, seatId: string): Promise<void> => {
  const key = `seat_lock:${showId}:${seatId}`;
  await redisClient.del(key);
};

export const confirmBooking = async (userId: string, showId: string, seats: string[], paymentId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate Show and Seats
    // We should re-check if seats are already booked in the DB just to be safe, 
    // although Redis lock prevents race conditions during the selection phase.
    const show = await Show.findById(showId).session(session);
    if (!show) throw new Error('Show not found');

    // Check if any seat is already permanently booked (DB level check)
    const alreadyBooked = seats.some(seat => show.bookedSeats.includes(seat));
    if (alreadyBooked) {
      throw new Error('One or more seats are already booked');
    }

    // 2. Create Booking
    const totalAmount = show.price * seats.length;
    const booking = new Booking({
      userId,
      showId,
      seats,
      totalAmount,
      status: 'CONFIRMED',
      paymentId
    });
    await booking.save({ session });

    // 3. Update Show (push to bookedSeats)
    show.bookedSeats.push(...seats);
    await show.save({ session });

    // 4. Update User (add to history)
    await User.findByIdAndUpdate(userId, {
      $push: { history: { bookingId: booking._id, bookedAt: new Date(), showId: show._id } }
    }, { session });

    await session.commitTransaction();

    // 5. Release Redis locks (Clean up)
    // Note: If this fails, keys expire in 5 mins anyway.
    // We do this AFTER commit to ensure we don't release lock before DB is consistent?
    // Actually, once DB is updated, the lock is irrelevant (seats are in bookedSeats), but good hygiene.
    // To be strictly safe, we release locks only after successful commit.
    Promise.all(seats.map(seat => unlockSeat(showId, seat))).catch(err => console.error('Failed to unlock seats', err));

    return booking;

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
