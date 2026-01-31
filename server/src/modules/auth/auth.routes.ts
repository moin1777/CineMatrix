import { Router } from 'express';
import * as AuthController from './auth.controller';
import { authLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

export default router;
