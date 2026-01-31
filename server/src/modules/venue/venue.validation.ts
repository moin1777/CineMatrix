import { z } from 'zod';

export const createVenueSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(50),
  state: z.string().min(2).max(50),
  zipCode: z.string().min(3).max(10),
  phone: z.string().optional(),
  email: z.string().email().optional()
});

export const updateVenueSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().min(5).max(200).optional(),
  city: z.string().min(2).max(50).optional(),
  state: z.string().min(2).max(50).optional(),
  zipCode: z.string().min(3).max(10).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional()
});

export const createHallSchema = z.object({
  venueId: z.string().min(1),
  name: z.string().min(1).max(50),
  rows: z.number().int().min(1).max(30),
  seatsPerRow: z.number().int().min(1).max(50),
  basePrice: z.number().positive(),
  amenities: z.array(z.string()).optional()
});

export const updateHallSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  amenities: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});
