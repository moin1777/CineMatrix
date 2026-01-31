import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/modules/auth/user.model';
import { Event } from '../../src/modules/event/event.model';
import { signAccessToken } from '../../src/modules/auth/auth.utils';

describe('Event API', () => {
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    // Create admin user
    const adminUser = await User.create({
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'admin'
    });
    adminToken = signAccessToken({ sub: adminUser._id.toString(), role: 'admin' });

    // Create regular user
    const regularUser = await User.create({
      email: 'user@example.com',
      password: 'Password123!',
      role: 'user'
    });
    userToken = signAccessToken({ sub: regularUser._id.toString(), role: 'user' });
  });

  describe('GET /api/events', () => {
    beforeEach(async () => {
      await Event.create([
        {
          title: 'Action Movie',
          description: 'An action movie',
          durationMinutes: 120,
          genre: ['Action'],
          language: 'English',
          isActive: true
        },
        {
          title: 'Comedy Movie',
          description: 'A comedy movie',
          durationMinutes: 90,
          genre: ['Comedy'],
          language: 'English',
          isActive: true
        },
        {
          title: 'Inactive Movie',
          description: 'An inactive movie',
          durationMinutes: 100,
          genre: ['Drama'],
          isActive: false
        }
      ]);
    });

    it('should return active events only by default', async () => {
      const res = await request(app).get('/api/events');

      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('should filter by genre', async () => {
      const res = await request(app).get('/api/events?genre=Action');

      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(1);
      expect(res.body.events[0].title).toBe('Action Movie');
    });

    it('should search events', async () => {
      const res = await request(app).get('/api/events/search?q=comedy');

      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(1);
      expect(res.body.events[0].title).toBe('Comedy Movie');
    });
  });

  describe('POST /api/events (Admin)', () => {
    it('should create event as admin', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'New Movie',
          description: 'A new movie',
          durationMinutes: 150,
          genre: ['Sci-Fi'],
          language: 'English'
        });

      expect(res.status).toBe(201);
      expect(res.body.event.title).toBe('New Movie');
    });

    it('should reject event creation by non-admin', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'New Movie',
          durationMinutes: 150
        });

      expect(res.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Missing title and duration'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return event by ID', async () => {
      const event = await Event.create({
        title: 'Test Movie',
        durationMinutes: 120,
        genre: ['Drama'],
        isActive: true
      });

      const res = await request(app).get(`/api/events/${event._id}`);

      expect(res.status).toBe(200);
      expect(res.body.event.title).toBe('Test Movie');
    });

    it('should return 404 for non-existent event', async () => {
      const res = await request(app).get('/api/events/000000000000000000000000');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/events/:id (Admin)', () => {
    it('should update event as admin', async () => {
      const event = await Event.create({
        title: 'Original Title',
        durationMinutes: 120,
        isActive: true
      });

      const res = await request(app)
        .put(`/api/events/${event._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title'
        });

      expect(res.status).toBe(200);
      expect(res.body.event.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/events/:id (Admin)', () => {
    it('should soft delete event as admin', async () => {
      const event = await Event.create({
        title: 'To Be Deleted',
        durationMinutes: 120,
        isActive: true
      });

      const res = await request(app)
        .delete(`/api/events/${event._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      const deletedEvent = await Event.findById(event._id);
      expect(deletedEvent?.isActive).toBe(false);
    });
  });
});
