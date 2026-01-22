import mongoose, { Schema, Document } from 'mongoose';

export interface IShow extends Document {
  eventId: mongoose.Types.ObjectId;
  startTime: Date;
  hallId: string; // Could be separate Hall/Theater schema properly, simplified as string ID for now
  totalSeats: number;
  price: number;
  bookedSeats: string[]; // Array of strings e.g. "A1", "A2", "B5"
  version: number; // For optimistic concurrency if needed (though we use Redis lock + Mongoose Transactions)
}

const ShowSchema = new Schema<IShow>({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  startTime: { type: Date, required: true, index: true },
  hallId: { type: String, required: true },
  totalSeats: { type: Number, required: true },
  price: { type: Number, required: true },
  bookedSeats: {
    type: [String],
    default: [],
    index: true // Useful for finding if a specific seat is booked in a show? Maybe.
  },
  // Mongoose handles __v for versioning automatically, but explicit if we want custom logic
}, { timestamps: true });

// Index for query performance on finding shows for an event
ShowSchema.index({ eventId: 1, startTime: 1 });

export const Show = mongoose.model<IShow>('Show', ShowSchema);
