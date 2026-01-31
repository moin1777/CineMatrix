import { z } from 'zod';

export const lockSeatSchema = z.object({
  showId: z.string().min(1, 'Show ID is required'),
  seatId: z.string().min(1, 'Seat ID is required').regex(/^[A-Z]\d+$/, 'Invalid seat format (e.g., A1, B12)')
});

export const lockMultipleSeatsSchema = z.object({
  showId: z.string().min(1, 'Show ID is required'),
  seatIds: z.array(
    z.string().min(1).regex(/^[A-Z]\d+$/, 'Invalid seat format')
  ).min(1, 'At least one seat is required').max(10, 'Maximum 10 seats per booking')
});

export const confirmBookingSchema = z.object({
  showId: z.string().min(1, 'Show ID is required'),
  seats: z.array(
    z.string().min(1).regex(/^[A-Z]\d+$/, 'Invalid seat format')
  ).min(1, 'At least one seat is required').max(10, 'Maximum 10 seats per booking'),
  paymentToken: z.string().min(1, 'Payment token is required')
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional()
});
