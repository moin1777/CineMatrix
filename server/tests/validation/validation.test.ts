import { registerSchema, loginSchema, changePasswordSchema } from '../../src/modules/auth/auth.validation';
import { createEventSchema, createShowSchema } from '../../src/modules/event/event.validation';
import { createVenueSchema, createHallSchema } from '../../src/modules/venue/venue.validation';
import { lockSeatSchema, confirmBookingSchema } from '../../src/modules/booking/booking.validation';

describe('Validation Schemas', () => {
  describe('Auth Validation', () => {
    describe('registerSchema', () => {
      it('should accept valid registration data', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'Password123!'
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid email', () => {
        const result = registerSchema.safeParse({
          email: 'invalid-email',
          password: 'Password123!'
        });
        expect(result.success).toBe(false);
      });

      it('should reject weak password', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'weak'
        });
        expect(result.success).toBe(false);
      });

      it('should reject password without uppercase', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'password123!'
        });
        expect(result.success).toBe(false);
      });
    });

    describe('loginSchema', () => {
      it('should accept valid login data', () => {
        const result = loginSchema.safeParse({
          email: 'test@example.com',
          password: 'any-password'
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Event Validation', () => {
    describe('createEventSchema', () => {
      it('should accept valid event data', () => {
        const result = createEventSchema.safeParse({
          title: 'Test Movie',
          durationMinutes: 120,
          genre: ['Action', 'Sci-Fi']
        });
        expect(result.success).toBe(true);
      });

      it('should reject event without title', () => {
        const result = createEventSchema.safeParse({
          durationMinutes: 120
        });
        expect(result.success).toBe(false);
      });

      it('should reject event with invalid duration', () => {
        const result = createEventSchema.safeParse({
          title: 'Test Movie',
          durationMinutes: 0
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Venue Validation', () => {
    describe('createVenueSchema', () => {
      it('should accept valid venue data', () => {
        const result = createVenueSchema.safeParse({
          name: 'Test Cinema',
          address: '123 Test Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        });
        expect(result.success).toBe(true);
      });

      it('should reject venue with short name', () => {
        const result = createVenueSchema.safeParse({
          name: 'A',
          address: '123 Test Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        });
        expect(result.success).toBe(false);
      });
    });

    describe('createHallSchema', () => {
      it('should accept valid hall data', () => {
        const result = createHallSchema.safeParse({
          venueId: '507f1f77bcf86cd799439011',
          name: 'Screen 1',
          rows: 10,
          seatsPerRow: 15,
          basePrice: 12.50
        });
        expect(result.success).toBe(true);
      });

      it('should reject hall with too many rows', () => {
        const result = createHallSchema.safeParse({
          venueId: '507f1f77bcf86cd799439011',
          name: 'Screen 1',
          rows: 50, // Max is 30
          seatsPerRow: 15,
          basePrice: 12.50
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Booking Validation', () => {
    describe('lockSeatSchema', () => {
      it('should accept valid seat lock data', () => {
        const result = lockSeatSchema.safeParse({
          showId: '507f1f77bcf86cd799439011',
          seatId: 'A1'
        });
        expect(result.success).toBe(true);
      });

      it('should accept double-digit seat numbers', () => {
        const result = lockSeatSchema.safeParse({
          showId: '507f1f77bcf86cd799439011',
          seatId: 'B15'
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid seat format', () => {
        const result = lockSeatSchema.safeParse({
          showId: '507f1f77bcf86cd799439011',
          seatId: '1A' // Should be A1 not 1A
        });
        expect(result.success).toBe(false);
      });
    });

    describe('confirmBookingSchema', () => {
      it('should accept valid booking data', () => {
        const result = confirmBookingSchema.safeParse({
          showId: '507f1f77bcf86cd799439011',
          seats: ['A1', 'A2', 'A3'],
          paymentToken: 'tok_visa'
        });
        expect(result.success).toBe(true);
      });

      it('should reject empty seats array', () => {
        const result = confirmBookingSchema.safeParse({
          showId: '507f1f77bcf86cd799439011',
          seats: [],
          paymentToken: 'tok_visa'
        });
        expect(result.success).toBe(false);
      });

      it('should reject more than 10 seats', () => {
        const result = confirmBookingSchema.safeParse({
          showId: '507f1f77bcf86cd799439011',
          seats: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'B1'],
          paymentToken: 'tok_visa'
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
