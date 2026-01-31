'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  QrCode,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api-client';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Booking, Event, Show, Venue } from '@/types';

// Mock bookings
const mockBookings: (Booking & { event: Event; show: Show; venue: Venue })[] = [
  {
    _id: 'b1',
    user: 'u1',
    show: 's1',
    seats: [
      { seatId: 'A5', category: 'premium', price: 250 },
      { seatId: 'A6', category: 'premium', price: 250 },
    ],
    totalAmount: 500,
    convenienceFee: 9,
    taxes: 2,
    finalAmount: 511,
    status: 'confirmed',
    paymentId: 'pay_123',
    paymentStatus: 'completed',
    bookingCode: 'CM7XK2P9',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: '',
    event: {
      _id: 'e1',
      title: 'Dune: Part Three',
      description: '',
      category: 'movie',
      genre: ['Sci-Fi'],
      language: ['English'],
      duration: 165,
      releaseDate: '',
      posterUrl: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=400',
      cast: [],
      crew: [],
      certificate: 'UA',
      status: 'now_showing',
      createdAt: '',
      updatedAt: '',
    },
    show: {
      _id: 's1',
      event: 'e1',
      venue: 'v1',
      screen: 'Screen 1',
      showTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: '',
      pricing: [],
      bookedSeats: [],
      status: 'scheduled',
      createdAt: '',
      updatedAt: '',
    },
    venue: {
      _id: 'v1',
      name: 'PVR IMAX',
      address: 'Phoenix Mall, Lower Parel',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400013',
      facilities: [],
      screens: [],
      createdAt: '',
      updatedAt: '',
    },
  },
  {
    _id: 'b2',
    user: 'u1',
    show: 's2',
    seats: [
      { seatId: 'C3', category: 'standard', price: 150 },
    ],
    totalAmount: 150,
    convenienceFee: 3,
    taxes: 1,
    finalAmount: 154,
    status: 'confirmed',
    paymentId: 'pay_456',
    paymentStatus: 'completed',
    bookingCode: 'CM9RP4M1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: '',
    event: {
      _id: 'e2',
      title: 'The Dark Knight Returns',
      description: '',
      category: 'movie',
      genre: ['Action'],
      language: ['English'],
      duration: 152,
      releaseDate: '',
      posterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=400',
      cast: [],
      crew: [],
      certificate: 'UA',
      status: 'now_showing',
      createdAt: '',
      updatedAt: '',
    },
    show: {
      _id: 's2',
      event: 'e2',
      venue: 'v2',
      screen: 'Insignia',
      showTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: '',
      pricing: [],
      bookedSeats: [],
      status: 'completed',
      createdAt: '',
      updatedAt: '',
    },
    venue: {
      _id: 'v2',
      name: 'INOX Megaplex',
      address: 'R City Mall, Ghatkopar',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400086',
      facilities: [],
      screens: [],
      createdAt: '',
      updatedAt: '',
    },
  },
];

export default function BookingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<typeof mockBookings>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?returnTo=/bookings');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get<typeof mockBookings>('/bookings');
        setBookings(response);
      } catch {
        setBookings(mockBookings);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  const filteredBookings = bookings.filter((booking) => {
    const showDate = new Date(booking.show.showTime);
    const now = new Date();

    if (filter === 'upcoming') return showDate > now;
    if (filter === 'past') return showDate <= now;
    return true;
  });

  const getStatusBadge = (booking: typeof mockBookings[0]) => {
    const showDate = new Date(booking.show.showTime);
    const now = new Date();

    if (booking.status === 'cancelled') {
      return <Badge variant="error">Cancelled</Badge>;
    }
    if (showDate > now) {
      return <Badge variant="success">Upcoming</Badge>;
    }
    return <Badge variant="default">Completed</Badge>;
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
          <p className="text-gray-400">View and manage your ticket bookings</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'upcoming', 'past'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface text-gray-300 hover:bg-surface-hover'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No bookings found
            </h2>
            <p className="text-gray-400 mb-6">
              {filter === 'upcoming'
                ? "You don't have any upcoming bookings"
                : filter === 'past'
                ? "You don't have any past bookings"
                : "You haven't made any bookings yet"}
            </p>
            <Link href="/movies">
              <button className="btn-primary btn-md">Browse Movies</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking, index) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Poster */}
                  <div className="sm:w-32 h-40 sm:h-auto flex-shrink-0">
                    <img
                      src={booking.event.posterUrl}
                      alt={booking.event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          {booking.event.title}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {booking.event.certificate} • {booking.event.language.join(', ')}
                        </p>
                      </div>
                      {getStatusBadge(booking)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {formatDate(booking.show.showTime)}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        {formatTime(booking.show.showTime)}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin className="w-4 h-4" />
                        {booking.venue.name}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Ticket className="w-4 h-4" />
                        {booking.seats.map((s) => s.seatId).join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div>
                        <span className="text-xs text-gray-500">Booking Code</span>
                        <p className="font-mono font-medium text-primary-400">
                          {booking.bookingCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">Total</span>
                        <p className="font-semibold text-white">
                          {formatCurrency(booking.finalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* QR Code / Actions */}
                  <div className="hidden sm:flex flex-col items-center justify-center px-4 border-l border-dashed border-border">
                    <QrCode className="w-12 h-12 text-gray-500 mb-2" />
                    <span className="text-xs text-gray-500">Show QR</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
