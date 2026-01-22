# AI-Powered Movie Reservation System Backend

## Architecture
Modular Monolith with:
- **Auth**: Dual-token rotation (Access Token in Body, Refresh Token in httpOnly Cookie).
- **Booking**: Redis distributed locking (`SET NX`) + Mongoose Transactions.
- **Resiliency**: Idempotency Middleware + Circuit Breaker for Payments.

## Stack
- Node.js, Express, TypeScript
- MongoDB (Mongoose)
- Redis (ioredis)

## Setup
1. Copy `.env` and fill in secrets (Keys are optional for Dev, strictly needed for Prod).
2. `npm install`
3. Ensure MongoDB is running on port 27017 (or update `.env`).
4. Ensure Redis is running on port 6379 (or update `.env`).
5. `npm run dev` (Need to add script)

## API Endpoints

### Auth
- `POST /api/auth/register` { email, password }
- `POST /api/auth/login` { email, password }
- `POST /api/auth/refresh` (Cookie required)
- `POST /api/auth/logout`

### Booking
- `POST /api/bookings/lock` { showId, seatId } - Locks seat for 5 mins.
- `POST /api/bookings/confirm` { showId, seats: [], paymentToken } - Transactional booking. Header `Idempotency-Key` supported.

## key Features Implementation
- **Concurrency**: `src/modules/booking/booking.service.ts` (Redis lock)
- **ACID**: `src/modules/booking/booking.service.ts` (Mongoose Transaction)
- **Idempotency**: `src/middleware/idempotency.middleware.ts`
