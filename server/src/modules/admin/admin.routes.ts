import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import * as AdminController from './admin.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', AdminController.getDashboard);
router.get('/analytics', AdminController.getAnalytics);
router.get('/movies', AdminController.getMovies);
router.patch('/movies/:id/status', AdminController.updateMovieStatus);
router.get('/pricing', AdminController.getPricing);
router.patch('/pricing/rules/:id/status', AdminController.updatePricingRuleStatus);
router.delete('/pricing/rules/:id', AdminController.removePricingRule);
router.get('/shows', AdminController.getShows);
router.patch('/shows/:id/cancel', AdminController.cancelShow);

export default router;
