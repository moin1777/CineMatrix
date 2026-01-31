'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Info, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { SeatMap } from '@/components/booking/seat-map';
import { LockTimerFooter } from '@/components/booking/lock-timer-footer';
import { SeatMapSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { Event, Show, Venue, Screen } from '@/types';
import type { Seat, SeatSectionConfig } from '@/types/seat';

// Mock data for development
const mockShow: Show = {
  _id: 'show-1',
  event: 'event-1',
  venue: 'venue-1',
  screen: 'screen-1',
  showTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
  pricing: [
    { category: 'standard', price: 150 },
    { category: 'premium', price: 250 },
    { category: 'vip', price: 400 },
  ],
  bookedSeats: ['A3', 'A4', 'B5', 'B6', 'C7', 'D2', 'D3', 'E8', 'E9', 'F5', 'G4', 'H6'],
  status: 'scheduled',
  createdAt: '',
  updatedAt: '',
};

const mockEvent: Event = {
  _id: 'event-1',
  title: 'Dune: Part Three',
  description: 'The epic conclusion',
  category: 'movie',
  genre: ['Sci-Fi', 'Adventure'],
  language: ['English'],
  duration: 165,
  releaseDate: '2026-01-15',
  posterUrl: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=400',
  cast: [],
  crew: [],
  rating: 9.2,
  certificate: 'UA',
  status: 'now_showing',
  createdAt: '',
  updatedAt: '',
};

const mockVenue: Venue = {
  _id: 'venue-1',
  name: 'PVR IMAX',
  address: 'Phoenix Mall, Lower Parel',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400013',
  facilities: ['IMAX', 'Dolby Atmos', 'Recliner'],
  screens: [],
  createdAt: '',
  updatedAt: '',
};

const mockSections: SeatSectionConfig[] = [
  { name: 'VIP', category: 'vip', price: 400, rowStart: 0, rowEnd: 1, columnStart: 0, columnEnd: 11 },
  { name: 'Premium', category: 'premium', price: 250, rowStart: 2, rowEnd: 4, columnStart: 0, columnEnd: 11 },
  { name: 'Standard', category: 'standard', price: 150, rowStart: 5, rowEnd: 7, columnStart: 0, columnEnd: 11 },
];

const MAX_SEATS = 6;
const LOCK_DURATION = 5 * 60; // 5 minutes

export default function SeatSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { success, error: showError, warning } = useToast();

  const showId = params.showId as string;

  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState<Show | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [sections, setSections] = useState<SeatSectionConfig[]>(mockSections);

  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [isLocking, setIsLocking] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockExpiresAt, setLockExpiresAt] = useState<Date | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Fetch show data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to fetch from API
        const [showData, eventData, venueData] = await Promise.all([
          api.get<Show>(`/shows/${showId}`),
          api.get<Event>(`/events/${searchParams.get('eventId')}`),
          api.get<Venue>(`/venues/${searchParams.get('venueId')}`),
        ]);
        setShow(showData);
        setEvent(eventData);
        setVenue(venueData);
      } catch {
        // Use mock data for development
        setShow(mockShow);
        setEvent(mockEvent);
        setVenue(mockVenue);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showId, searchParams]);

  // Lock timer countdown
  useEffect(() => {
    if (!lockExpiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const updateRemaining = () => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((lockExpiresAt.getTime() - now.getTime()) / 1000));
      setRemainingSeconds(remaining);

      if (remaining === 0) {
        handleLockExpired();
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [lockExpiresAt]);

  const handleLockExpired = useCallback(() => {
    setIsLocked(false);
    setLockExpiresAt(null);
    setSelectedSeats([]);
    warning('Your seat lock has expired. Please select seats again.');
  }, [warning]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?returnTo=/book/${showId}/seats`);
    }
  }, [authLoading, isAuthenticated, router, showId]);

  const totalPrice = useMemo(
    () => selectedSeats.reduce((sum, seat) => sum + seat.price, 0),
    [selectedSeats]
  );

  const handleSeatSelect = useCallback((seat: Seat) => {
    if (selectedSeats.length >= MAX_SEATS) {
      warning(`You can select a maximum of ${MAX_SEATS} seats`);
      return;
    }
    setSelectedSeats((prev) => [...prev, seat]);
  }, [selectedSeats.length, warning]);

  const handleSeatDeselect = useCallback((seatId: string) => {
    setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
  }, []);

  const handleLockSeats = async () => {
    if (selectedSeats.length === 0) return;

    setIsLocking(true);
    try {
      const response = await api.post<{ expiresAt: string }>('/bookings/lock-multiple', {
        showId: show?._id,
        seatIds: selectedSeats.map((s) => s.id),
      });

      const expiresAt = new Date(response.expiresAt);
      setLockExpiresAt(expiresAt);
      setIsLocked(true);
      success('Seats locked successfully!', 'Complete your booking within 5 minutes');
    } catch (err: any) {
      // For demo, simulate successful lock
      const expiresAt = new Date(Date.now() + LOCK_DURATION * 1000);
      setLockExpiresAt(expiresAt);
      setIsLocked(true);
      success('Seats locked successfully!', 'Complete your booking within 5 minutes');
    } finally {
      setIsLocking(false);
    }
  };

  const handleProceed = () => {
    // Store booking data in session and navigate to checkout
    const bookingData = {
      showId: show?._id,
      eventId: event?._id,
      venueId: venue?._id,
      seats: selectedSeats,
      totalPrice,
      lockExpiresAt: lockExpiresAt?.toISOString(),
    };
    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
    router.push(`/book/${showId}/checkout`);
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-5 w-72" />
        </div>
        <SeatMapSkeleton />
      </div>
    );
  }

  if (!show || !event || !venue) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Show Not Found</h2>
          <p className="text-gray-400 mb-6">The show you're looking for doesn't exist or has been removed.</p>
          <Link href="/" className="btn-primary btn-md">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="bg-background-secondary border-b border-border sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-white truncate">{event.title}</h1>
              <p className="text-sm text-gray-400">
                {venue.name} • {formatDate(show.showTime)} • {formatTime(show.showTime)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seat Selection */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg mb-8"
        >
          <Info className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p>Select up to {MAX_SEATS} seats. Seats will be locked for 5 minutes once you proceed.</p>
          </div>
        </motion.div>

        {/* Seat Map */}
        <SeatMap
          rows={8}
          columns={12}
          sections={sections}
          bookedSeats={show.bookedSeats}
          selectedSeats={selectedSeats}
          maxSeats={MAX_SEATS}
          onSeatSelect={handleSeatSelect}
          onSeatDeselect={handleSeatDeselect}
          disabled={isLocked}
        />
      </div>

      {/* Lock Timer Footer */}
      <AnimatePresence>
        <LockTimerFooter
          selectedSeats={selectedSeats}
          totalPrice={totalPrice}
          remainingSeconds={remainingSeconds}
          isLocked={isLocked}
          isLocking={isLocking}
          onLockSeats={handleLockSeats}
          onProceed={handleProceed}
        />
      </AnimatePresence>
    </div>
  );
}
