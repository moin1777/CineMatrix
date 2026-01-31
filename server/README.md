# 🎬 Cinematrix - Movie & Event Ticket Booking System

A production-ready, scalable ticket booking system API similar to BookMyShow and District. Built with Node.js, Express, TypeScript, MongoDB, and Redis.

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with RS256 access tokens
- Secure refresh token rotation via httpOnly cookies
- Role-based access control (User/Admin)
- Password hashing with bcrypt
- Rate limiting on auth endpoints

### 🎟️ Ticket Booking
- Distributed seat locking with Redis (5-minute TTL)
- Atomic booking transactions with MongoDB sessions
- Idempotent payment confirmation
- Booking cancellation with refund policy
- Multi-seat booking support (max 10 per transaction)

### 🏢 Venue & Hall Management
- Venue CRUD operations
- Hall configuration with auto-generated seat maps
- Seat types: Regular, Premium, VIP, Wheelchair
- Dynamic pricing per seat type

### 🎬 Event & Show Management
- Event (movie) CRUD with rich metadata
- Show scheduling with conflict detection
- Bulk show creation for efficiency
- Available seats API with row-grouped response

### 💳 Payment Processing
- Circuit breaker pattern for external payment service
- Automatic refund queue for failed transactions
- Payment service health monitoring

### 📊 Admin Dashboard APIs
- Booking statistics and revenue reports
- User management
- Show and event analytics

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        API Gateway                           │
│  Rate Limiting │ Auth │ Validation │ Idempotency            │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│                      API Routes                              │
│  /auth  │  /events  │  /venues  │  /bookings  │  /users     │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│                    Business Logic                            │
│  Controllers → Services → Models                             │
└──────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────┬────────────────────────────────────────┐
│      MongoDB        │              Redis                     │
│  • Users            │  • Seat Locks                         │
│  • Events           │  • Rate Limit Counters                │
│  • Shows            │  • Idempotency Keys                   │
│  • Bookings         │  • Session Cache                      │
│  • Venues/Halls     │                                        │
└─────────────────────┴────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Redis 7+

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Running the Server

```bash
# Development mode with hot reload
npm run dev

# Seed the database with sample data
npm run seed

# Production build
npm run build
npm start
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

## 📚 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout and clear cookies |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List all events (paginated) |
| GET | `/api/events/:id` | Get event details |
| GET | `/api/events/search?q=query` | Search events |
| GET | `/api/events/:id/shows` | Get shows for an event |
| POST | `/api/events` | Create event (Admin) |
| PUT | `/api/events/:id` | Update event (Admin) |
| DELETE | `/api/events/:id` | Delete event (Admin) |

### Shows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/shows/:showId/seats` | Get available seats |
| GET | `/api/events/shows/:id` | Get show details |
| POST | `/api/events/shows` | Create show (Admin) |
| POST | `/api/events/shows/bulk` | Bulk create shows (Admin) |

### Venues

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/venues` | List all venues |
| GET | `/api/venues/:id` | Get venue details |
| GET | `/api/venues/:id/halls` | Get halls in venue |
| GET | `/api/venues/halls/:id/seatmap` | Get hall seat map |
| POST | `/api/venues` | Create venue (Admin) |
| POST | `/api/venues/halls` | Create hall (Admin) |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings/lock` | Lock single seat |
| POST | `/api/bookings/lock-multiple` | Lock multiple seats |
| POST | `/api/bookings/unlock` | Unlock seat |
| POST | `/api/bookings/confirm` | Confirm booking with payment |
| POST | `/api/bookings/:id/cancel` | Cancel booking |
| GET | `/api/bookings/:id` | Get booking details |
| GET | `/api/bookings` | List all bookings (Admin) |
| GET | `/api/bookings/stats/overview` | Booking statistics (Admin) |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get current user profile |
| PUT | `/api/users/profile` | Update profile |
| POST | `/api/users/change-password` | Change password |
| GET | `/api/users/bookings` | Get booking history |
| GET | `/api/users/stats` | Get user statistics |
| GET | `/api/users` | List all users (Admin) |
| PUT | `/api/users/:id/role` | Update user role (Admin) |

## 🔒 Security Features

- **Helmet**: HTTP security headers
- **CORS**: Configurable cross-origin requests
- **Rate Limiting**: Redis-backed with sliding window support
- **Input Validation**: Zod schemas on all endpoints
- **NoSQL Injection Prevention**: Mongoose sanitization
- **XSS Protection**: Helmet XSS filter
- **CSRF Protection**: SameSite cookies

## 📦 Project Structure

```
server/
├── src/
│   ├── app.ts                 # Express app setup
│   ├── server.ts              # Server entry point
│   ├── config/
│   │   ├── database.ts        # MongoDB & Redis connections
│   │   └── env.ts             # Environment configuration
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT authentication
│   │   ├── admin.middleware.ts     # Admin authorization
│   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   └── idempotency.middleware.ts
│   ├── modules/
│   │   ├── auth/              # Authentication module
│   │   ├── booking/           # Booking module
│   │   ├── event/             # Event & Show module
│   │   ├── venue/             # Venue & Hall module
│   │   └── user/              # User management module
│   ├── scripts/
│   │   └── seed.ts            # Database seeding
│   └── utils/
│       └── payment.provider.ts # Payment with circuit breaker
├── tests/                     # Test files
├── package.json
├── tsconfig.json
└── jest.config.js
```

## 🔄 Booking Flow

```
1. User browses events → GET /api/events
2. User selects a show → GET /api/events/:eventId/shows
3. User views available seats → GET /api/events/shows/:showId/seats
4. User locks seats → POST /api/bookings/lock-multiple
   └─ Redis: SET seat_lock:{showId}:{seatId} NX EX 300
5. User confirms with payment → POST /api/bookings/confirm
   ├─ Validate seats not booked in DB
   ├─ Process payment (Circuit Breaker)
   └─ MongoDB Transaction:
       ├─ Create Booking (CONFIRMED)
       ├─ Update Show.bookedSeats
       └─ Update User.history
   └─ Release Redis locks
```

## 🧪 Testing

The project includes comprehensive tests:

- **Unit Tests**: Validation schemas, utilities
- **Integration Tests**: API endpoints
- **E2E Tests**: Complete booking flow

```bash
npm test                    # Run all tests
npm run test:coverage       # Generate coverage report
```

## 📈 Monitoring

- **Health Check**: `GET /health`
- **Service Status**: `GET /api/status` (includes circuit breaker states)

## 📄 License

ISC
