import { Router } from 'express';
import { venueTemplateController } from './venue-template.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';

const router = Router();

// ============================================================================
// PUBLIC ROUTES (Authenticated users can view)
// ============================================================================

// Get active template for a venue screen (for booking)
router.get(
  '/venue/:venueId/screen/:screenId/active',
  authenticate,
  venueTemplateController.getActiveTemplate.bind(venueTemplateController)
);

// Get template by ID
router.get(
  '/:id',
  authenticate,
  venueTemplateController.getById.bind(venueTemplateController)
);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// Get all templates (with pagination and filters)
router.get(
  '/',
  authenticate,
  requireAdmin,
  venueTemplateController.getAll.bind(venueTemplateController)
);

// Get all templates for a venue
router.get(
  '/venue/:venueId',
  authenticate,
  requireAdmin,
  venueTemplateController.getByVenue.bind(venueTemplateController)
);

// Get templates requiring maintenance
router.get(
  '/maintenance/required',
  authenticate,
  requireAdmin,
  venueTemplateController.getMaintenanceRequired.bind(venueTemplateController)
);

// Get template statistics
router.get(
  '/:id/stats',
  authenticate,
  requireAdmin,
  venueTemplateController.getStats.bind(venueTemplateController)
);

// Export template as JSON
router.get(
  '/:id/export',
  authenticate,
  requireAdmin,
  venueTemplateController.exportTemplate.bind(venueTemplateController)
);

// Create a new template
router.post(
  '/',
  authenticate,
  requireAdmin,
  venueTemplateController.create.bind(venueTemplateController)
);

// Generate a layout automatically
router.post(
  '/generate',
  authenticate,
  requireAdmin,
  venueTemplateController.generateLayout.bind(venueTemplateController)
);

// Clone a template
router.post(
  '/:id/clone',
  authenticate,
  requireAdmin,
  venueTemplateController.clone.bind(venueTemplateController)
);

// Publish a draft template
router.post(
  '/:id/publish',
  authenticate,
  requireAdmin,
  venueTemplateController.publish.bind(venueTemplateController)
);

// Update a template
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  venueTemplateController.update.bind(venueTemplateController)
);

// Update a single seat
router.patch(
  '/:id/seats/update',
  authenticate,
  requireAdmin,
  venueTemplateController.updateSeat.bind(venueTemplateController)
);

// Bulk update seats
router.patch(
  '/:id/seats/bulk-update',
  authenticate,
  requireAdmin,
  venueTemplateController.bulkUpdateSeats.bind(venueTemplateController)
);

// Add seats to template
router.post(
  '/:id/seats',
  authenticate,
  requireAdmin,
  venueTemplateController.addSeats.bind(venueTemplateController)
);

// Remove seats from template
router.delete(
  '/:id/seats',
  authenticate,
  requireAdmin,
  venueTemplateController.removeSeats.bind(venueTemplateController)
);

// Delete a template
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  venueTemplateController.delete.bind(venueTemplateController)
);

export default router;
