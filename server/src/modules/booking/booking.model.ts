import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  showId: mongoose.Types.ObjectId;
  seats: string[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  paymentId?: string; // Stripe Payment Intent ID
}

const BookingSchema = new Schema<IBooking>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  showId: { type: Schema.Types.ObjectId, ref: 'Show', required: true, index: true },
  seats: [{ type: String, required: true }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED'], default: 'PENDING' },
  paymentId: { type: String }
}, { timestamps: true });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
