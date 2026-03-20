import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import * as AdminController from './admin.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', AdminController.getDashboard);
router.get('/movies', AdminController.getMovies);
router.patch('/movies/:id/status', AdminController.updateMovieStatus);

export default router;
