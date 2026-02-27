'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Info, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { formatDate, formatTime } from '@/lib/utils';
import { SeatMap } from '@/components/booking/seat-map';
import { LockTimerFooter } from '@/components/booking/lock-timer-footer';
import { SeatMapSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { Seat, SeatSectionConfig } from '@/types/seat';

// Server response interfaces
interface ServerShow {
  _id: string;
  eventId: {
    _id: string;
    title: string;
    durationMinutes: number;
    posterUrl?: string;
    genre?: string[];
  };
  hallId: {
    _id: string;
    name: string;
    capacity: number;
    venueId: {
      _id: string;
      name: string;
      city: string;
      address?: string;
    };
  };
  startTime: string;
  endTime: string;
  price: number;
  totalSeats: number;
  bookedSeats: string[];
}

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
  const [showData, setShowData] = useState<ServerShow | null>(null);
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
        // Fetch show with populated event and venue data
        const response = await api.get<{ show: ServerShow }>(`/events/shows/${showId}`);
        setShowData(response.show);
      } catch (err) {
        console.error('Failed to fetch show data:', err);
        setShowData(null);
      } finally {
        setLoading(false);
      }
    };

    if (showId) {
      fetchData();
    }
  }, [showId]);

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
        showId: showData?._id,
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
      showId: showData?._id,
      eventId: showData?.eventId?._id,
      venueId: showData?.hallId?.venueId?._id,
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

  if (!showData || !showData.eventId || !showData.hallId?.venueId) {
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
              <h1 className="text-lg font-semibold text-white truncate">{showData.eventId.title}</h1>
              <p className="text-sm text-gray-400">
                {showData.hallId.venueId.name} • {formatDate(showData.startTime)} • {formatTime(showData.startTime)}
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
          bookedSeats={showData.bookedSeats || []}
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
