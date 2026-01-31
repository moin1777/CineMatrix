import mongoose, { Schema, Document } from 'mongoose';

export interface IShow extends Document {
  eventId: mongoose.Types.ObjectId;
  hallId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  totalSeats: number;
  price: number;
  bookedSeats: string[];
  version: number;
}

const ShowSchema = new Schema<IShow>({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  hallId: { type: Schema.Types.ObjectId, ref: 'Hall', required: true, index: true },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true },
  totalSeats: { type: Number, required: true },
  price: { type: Number, required: true },
  bookedSeats: {
    type: [String],
    default: [],
    index: true
  }
}, { timestamps: true });

// Compound indexes for common queries
ShowSchema.index({ eventId: 1, startTime: 1 });
ShowSchema.index({ hallId: 1, startTime: 1 });
ShowSchema.index({ startTime: 1, endTime: 1 });

export const Show = mongoose.model<IShow>('Show', ShowSchema);
