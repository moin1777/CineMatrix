import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { getPaymentServiceStats } from './utils/payment.provider';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import bookingRoutes from './modules/booking/booking.routes';
import eventRoutes from './modules/event/event.routes';
import venueRoutes from './modules/venue/venue.routes';
import userRoutes from './modules/user/user.routes';

const app = express();

// ============ SECURITY MIDDLEWARE ============
app.use(helmet());
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
}));

// ============ BODY PARSING ============
app.use(express.json({ limit: '10kb' })); // Limit body size for security
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ============ GLOBAL RATE LIMITING ============
app.use('/api', apiLimiter);

// ============ API ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/users', userRoutes);

// ============ HEALTH & STATUS ENDPOINTS ============
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: config.env
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    services: {
      payment: getPaymentServiceStats()
    }
  });
});

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// ============ GLOBAL ERROR HANDLER ============
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: config.env === 'production' ? 'Internal Server Error' : err.message,
    ...(config.env !== 'production' && { stack: err.stack })
  });
});

export default app;
