import { Router } from 'express';
import * as VenueController from './venue.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';

const router = Router();

// ============ PUBLIC ROUTES ============
// Get all active venues (for users to browse)
router.get('/', VenueController.getAllVenues);
router.get('/:id', VenueController.getVenue);
router.get('/:venueId/halls', VenueController.getHallsByVenue);

// ============ ADMIN ROUTES ============
// Venue management
router.post('/', authenticate, requireAdmin, VenueController.createVenue);
router.put('/:id', authenticate, requireAdmin, VenueController.updateVenue);
router.delete('/:id', authenticate, requireAdmin, VenueController.deleteVenue);

// Hall management
router.post('/halls', authenticate, requireAdmin, VenueController.createHall);
router.get('/halls/:id', VenueController.getHall);
router.get('/halls/:id/seatmap', VenueController.getHallSeatMap);
router.put('/halls/:id', authenticate, requireAdmin, VenueController.updateHall);
router.delete('/halls/:id', authenticate, requireAdmin, VenueController.deleteHall);

export default router;
