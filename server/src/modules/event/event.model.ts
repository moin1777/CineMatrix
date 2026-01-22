import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  durationMinutes: number;
  posterUrl?: string; // e.g. from a helper or CDN
  genre: string[];
  isActive: boolean;
}

const EventSchema = new Schema<IEvent>({
  title: { type: String, required: true, index: true },
  description: { type: String },
  durationMinutes: { type: Number, required: true },
  posterUrl: { type: String },
  genre: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Event = mongoose.model<IEvent>('Event', EventSchema);
