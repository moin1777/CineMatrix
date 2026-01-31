import { Router } from 'express';
import * as EventController from './event.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';

const router = Router();

// ============ PUBLIC ROUTES ============
// Events
router.get('/', EventController.getAllEvents);
router.get('/search', EventController.searchEvents);
router.get('/:id', EventController.getEvent);
router.get('/:eventId/shows', EventController.getShowsForEvent);

// Shows
router.get('/shows/:showId/seats', EventController.getAvailableSeats);

// ============ ADMIN ROUTES ============
// Event management
router.post('/', authenticate, requireAdmin, EventController.createEvent);
router.put('/:id', authenticate, requireAdmin, EventController.updateEvent);
router.delete('/:id', authenticate, requireAdmin, EventController.deleteEvent);

// Show management
router.post('/shows', authenticate, requireAdmin, EventController.createShow);
router.post('/shows/bulk', authenticate, requireAdmin, EventController.bulkCreateShows);
router.get('/shows/:id', EventController.getShow);
router.put('/shows/:id', authenticate, requireAdmin, EventController.updateShow);
router.delete('/shows/:id', authenticate, requireAdmin, EventController.deleteShow);

// Shows by venue
router.get('/venue/:venueId/shows', EventController.getShowsByVenue);

export default router;
