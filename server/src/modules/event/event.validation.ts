import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  durationMinutes: z.number().int().min(1).max(600),
  posterUrl: z.string().url().optional(),
  genre: z.array(z.string()).optional(),
  language: z.string().optional(),
  rating: z.string().optional(),
  releaseDate: z.string().datetime().optional()
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  durationMinutes: z.number().int().min(1).max(600).optional(),
  posterUrl: z.string().url().optional(),
  genre: z.array(z.string()).optional(),
  language: z.string().optional(),
  rating: z.string().optional(),
  releaseDate: z.string().datetime().optional(),
  isActive: z.boolean().optional()
});

export const createShowSchema = z.object({
  eventId: z.string().min(1),
  hallId: z.string().min(1),
  startTime: z.string().datetime(),
  price: z.number().positive()
});

export const updateShowSchema = z.object({
  startTime: z.string().datetime().optional(),
  price: z.number().positive().optional()
});

export const bulkCreateShowsSchema = z.object({
  eventId: z.string().min(1),
  hallId: z.string().min(1),
  showTimes: z.array(z.string().datetime()).min(1),
  price: z.number().positive()
});
