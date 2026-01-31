import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  showId: mongoose.Types.ObjectId;
  seats: string[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  paymentId?: string;
  refundId?: string;
  refundAmount?: number;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  showId: { type: Schema.Types.ObjectId, ref: 'Show', required: true, index: true },
  seats: [{ type: String, required: true }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED'], default: 'PENDING', index: true },
  paymentId: { type: String, index: true },
  refundId: { type: String },
  refundAmount: { type: Number },
  cancelledAt: { type: Date },
  cancellationReason: { type: String }
}, { timestamps: true });

// Compound indexes for common queries
BookingSchema.index({ userId: 1, status: 1 });
BookingSchema.index({ showId: 1, status: 1 });
BookingSchema.index({ createdAt: -1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
