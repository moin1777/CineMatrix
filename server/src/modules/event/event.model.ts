import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  durationMinutes: number;
  posterUrl?: string;
  bannerUrl?: string;
  trailerUrl?: string;
  genre: string[];
  language?: string;
  rating?: string;
  releaseDate?: Date;
  cast?: string[];
  director?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  title: { type: String, required: true, index: true },
  description: { type: String },
  durationMinutes: { type: Number, required: true },
  posterUrl: { type: String },
  bannerUrl: { type: String },
  trailerUrl: { type: String },
  genre: [{ type: String, index: true }],
  language: { type: String, index: true },
  rating: { type: String },
  releaseDate: { type: Date },
  cast: [{ type: String }],
  director: { type: String },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

// Text index for search - using 'none' to support all languages
// language_override prevents MongoDB from using a field called 'language' for text index language
EventSchema.index({ title: 'text', description: 'text' }, { default_language: 'none', language_override: 'textSearchLanguage' });

export const Event = mongoose.model<IEvent>('Event', EventSchema);
