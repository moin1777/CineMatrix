import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/modules/auth/user.model';
import { Event } from '../../src/modules/event/event.model';
import { Show } from '../../src/modules/event/show.model';
import { Venue, Hall, generateSeatMap } from '../../src/modules/venue/venue.model';
import { signAccessToken } from '../../src/modules/auth/auth.utils';

describe('Booking API', () => {
  let userToken: string;
  let adminToken: string;
  let testShow: any;
  let testUser: any;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      email: 'testuser@example.com',
      password: 'Password123!',
      role: 'user'
    });
    userToken = signAccessToken({ sub: testUser._id.toString(), role: 'user' });

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'admin'
    });
    adminToken = signAccessToken({ sub: adminUser._id.toString(), role: 'admin' });

    // Create venue and hall
    const venue = await Venue.create({
      name: 'Test Venue',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345'
    });

    const hall = await Hall.create({
      venueId: venue._id,
      name: 'Test Hall',
      capacity: 100,
      rows: 10,
      seatsPerRow: 10,
      seatMap: generateSeatMap(10, 10, 15),
      amenities: ['Dolby']
    });

    // Create event
    const event = await Event.create({
      title: 'Test Movie',
      description: 'A test movie',
      durationMinutes: 120,
      genre: ['Action'],
      isActive: true
    });

    // Create show
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 24);
    const endTime = new Date(startTime.getTime() + 120 * 60000);

    testShow = await Show.create({
      eventId: event._id,
      hallId: hall._id,
      startTime,
      endTime,
      price: 15,
      totalSeats: 100,
      bookedSeats: []
    });
  });

  describe('POST /api/bookings/lock', () => {
    it('should lock a seat successfully', async () => {
      const res = await request(app)
        .post('/api/bookings/lock')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          showId: testShow._id.toString(),
          seatId: 'A1'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Seat locked successfully');
      expect(res.body.seatId).toBe('A1');
      expect(res.body.expiresIn).toBe(300);
    });

    it('should reject lock without authentication', async () => {
      const res = await request(app)
        .post('/api/bookings/lock')
        .send({
          showId: testShow._id.toString(),
          seatId: 'A1'
        });

      expect(res.status).toBe(401);
    });

    it('should reject invalid seat format', async () => {
      const res = await request(app)
        .post('/api/bookings/lock')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          showId: testShow._id.toString(),
          seatId: 'invalid'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/bookings/lock-multiple', () => {
    it('should lock multiple seats successfully', async () => {
      const res = await request(app)
        .post('/api/bookings/lock-multiple')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          showId: testShow._id.toString(),
          seatIds: ['A1', 'A2', 'A3']
        });

      expect(res.status).toBe(200);
      expect(res.body.seats).toHaveLength(3);
    });

    it('should reject more than 10 seats', async () => {
      const res = await request(app)
        .post('/api/bookings/lock-multiple')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          showId: testShow._id.toString(),
          seatIds: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'B1']
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/bookings/confirm', () => {
    it('should confirm booking successfully', async () => {
      const res = await request(app)
        .post('/api/bookings/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', 'test-key-1')
        .send({
          showId: testShow._id.toString(),
          seats: ['A1', 'A2'],
          paymentToken: 'valid_token'
        });

      expect(res.status).toBe(201);
      expect(res.body.booking).toBeDefined();
      expect(res.body.booking.seats).toEqual(['A1', 'A2']);
      expect(res.body.booking.status).toBe('CONFIRMED');
    });

    it('should reject booking without payment token', async () => {
      const res = await request(app)
        .post('/api/bookings/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          showId: testShow._id.toString(),
          seats: ['A1']
        });

      expect(res.status).toBe(400);
    });

    it('should reject booking for non-existent show', async () => {
      const res = await request(app)
        .post('/api/bookings/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          showId: '000000000000000000000000',
          seats: ['A1'],
          paymentToken: 'valid_token'
        });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/bookings/stats/overview (Admin)', () => {
    it('should return booking stats for admin', async () => {
      const res = await request(app)
        .get('/api/bookings/stats/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalBookings).toBeDefined();
      expect(res.body.totalRevenue).toBeDefined();
    });

    it('should reject non-admin access', async () => {
      const res = await request(app)
        .get('/api/bookings/stats/overview')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
