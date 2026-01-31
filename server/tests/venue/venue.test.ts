import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/modules/auth/user.model';
import { Venue, Hall } from '../../src/modules/venue/venue.model';
import { signAccessToken } from '../../src/modules/auth/auth.utils';

describe('Venue API', () => {
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    const adminUser = await User.create({
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'admin'
    });
    adminToken = signAccessToken({ sub: adminUser._id.toString(), role: 'admin' });

    const regularUser = await User.create({
      email: 'user@example.com',
      password: 'Password123!',
      role: 'user'
    });
    userToken = signAccessToken({ sub: regularUser._id.toString(), role: 'user' });
  });

  describe('GET /api/venues', () => {
    beforeEach(async () => {
      await Venue.create([
        {
          name: 'Downtown Cinema',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          isActive: true
        },
        {
          name: 'Mall Cinema',
          address: '456 Mall Blvd',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          isActive: true
        }
      ]);
    });

    it('should return all active venues', async () => {
      const res = await request(app).get('/api/venues');

      expect(res.status).toBe(200);
      expect(res.body.venues).toHaveLength(2);
    });

    it('should filter venues by city', async () => {
      const res = await request(app).get('/api/venues?city=New York');

      expect(res.status).toBe(200);
      expect(res.body.venues).toHaveLength(1);
      expect(res.body.venues[0].city).toBe('New York');
    });
  });

  describe('POST /api/venues (Admin)', () => {
    it('should create venue as admin', async () => {
      const res = await request(app)
        .post('/api/venues')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Cinema',
          address: '789 New St',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601'
        });

      expect(res.status).toBe(201);
      expect(res.body.venue.name).toBe('New Cinema');
    });

    it('should reject venue creation by non-admin', async () => {
      const res = await request(app)
        .post('/api/venues')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'New Cinema',
          address: '789 New St',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/venues/halls (Admin)', () => {
    let testVenue: any;

    beforeEach(async () => {
      testVenue = await Venue.create({
        name: 'Test Venue',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      });
    });

    it('should create hall with auto-generated seat map', async () => {
      const res = await request(app)
        .post('/api/venues/halls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          venueId: testVenue._id.toString(),
          name: 'Screen 1',
          rows: 10,
          seatsPerRow: 15,
          basePrice: 12.00,
          amenities: ['IMAX', 'Dolby Atmos']
        });

      expect(res.status).toBe(201);
      expect(res.body.hall.name).toBe('Screen 1');
      expect(res.body.hall.capacity).toBe(150); // 10 * 15
      expect(res.body.hall.seatMap).toHaveLength(150);
    });

    it('should reject hall creation with invalid venue', async () => {
      const res = await request(app)
        .post('/api/venues/halls')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          venueId: '000000000000000000000000',
          name: 'Screen 1',
          rows: 10,
          seatsPerRow: 15,
          basePrice: 12.00
        });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/venues/halls/:id/seatmap', () => {
    it('should return hall seat map', async () => {
      const venue = await Venue.create({
        name: 'Test Venue',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      });

      const hall = await Hall.create({
        venueId: venue._id,
        name: 'Screen 1',
        capacity: 100,
        rows: 10,
        seatsPerRow: 10,
        seatMap: [
          { row: 'A', number: 1, type: 'regular', price: 12 },
          { row: 'A', number: 2, type: 'regular', price: 12 }
        ],
        amenities: []
      });

      const res = await request(app).get(`/api/venues/halls/${hall._id}/seatmap`);

      expect(res.status).toBe(200);
      expect(res.body.hallId).toBeDefined();
      expect(res.body.seatMap).toHaveLength(2);
    });
  });
});
