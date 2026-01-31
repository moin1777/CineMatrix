// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  preferences?: {
    genres: string[];
    languages: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// Event/Movie Types
export interface Event {
  _id: string;
  title: string;
  description: string;
  category: 'movie' | 'concert' | 'sports' | 'theatre' | 'comedy' | 'other';
  genre: string[];
  language: string[];
  duration: number; // in minutes
  releaseDate: string;
  posterUrl: string;
  bannerUrl?: string;
  trailerUrl?: string;
  cast: CastMember[];
  crew: CrewMember[];
  rating?: number;
  certificate?: string;
  status: 'upcoming' | 'now_showing' | 'ended';
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CastMember {
  name: string;
  role: string;
  imageUrl?: string;
}

export interface CrewMember {
  name: string;
  role: string;
  imageUrl?: string;
}

// Venue Types
export interface Venue {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  facilities: string[];
  screens: Screen[];
  createdAt: string;
  updatedAt: string;
}

export interface Screen {
  _id: string;
  name: string;
  layout: SeatLayout;
  totalSeats: number;
  screenType: 'standard' | 'imax' | 'dolby' | '4dx' | 'screenx';
}

export interface SeatLayout {
  rows: number;
  columns: number;
  sections: SeatSection[];
}

export interface SeatSection {
  name: string;
  category: 'standard' | 'premium' | 'vip' | 'recliner';
  price: number;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
  unavailableSeats?: string[];
}

// Show Types
export interface Show {
  _id: string;
  event: string | Event;
  venue: string | Venue;
  screen: string;
  showTime: string;
  endTime: string;
  pricing: ShowPricing[];
  bookedSeats: string[];
  lockedSeats?: LockedSeat[];
  status: 'scheduled' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface ShowPricing {
  category: 'standard' | 'premium' | 'vip' | 'recliner';
  price: number;
}

export interface LockedSeat {
  seatId: string;
  lockedBy: string;
  lockedAt: string;
  expiresAt: string;
}

// Booking Types
export interface Booking {
  _id: string;
  user: string | User;
  show: string | Show;
  seats: BookedSeat[];
  totalAmount: number;
  convenienceFee: number;
  taxes: number;
  finalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'failed';
  paymentId?: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  bookingCode: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookedSeat {
  seatId: string;
  category: string;
  price: number;
}

// Lock Types
export interface LockRequest {
  showId: string;
  seatIds: string[];
}

export interface LockResponse {
  success: boolean;
  lockedSeats: string[];
  expiresAt: string;
  message?: string;
}

export interface UnlockRequest {
  showId: string;
  seatIds: string[];
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchFilters {
  query?: string;
  category?: string;
  genre?: string[];
  language?: string[];
  city?: string;
  date?: string;
  page?: number;
  limit?: number;
}

// Payment Types
export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface ConfirmBookingRequest {
  showId: string;
  seatIds: string[];
  paymentMethodId?: string;
}

export interface ConfirmBookingResponse {
  booking: Booking;
  message: string;
}
