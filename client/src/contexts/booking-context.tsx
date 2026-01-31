'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { api } from '@/lib/api-client';
import type { Seat, SeatSelection } from '@/types/seat';
import type { Show } from '@/types';

interface BookingContextType {
  show: Show | null;
  selectedSeats: Seat[];
  totalPrice: number;
  lockExpiresAt: Date | null;
  remainingSeconds: number;
  isLocking: boolean;
  isLocked: boolean;
  maxSeats: number;
  setShow: (show: Show | null) => void;
  selectSeat: (seat: Seat) => void;
  deselectSeat: (seatId: string) => void;
  clearSelection: () => void;
  lockSeats: () => Promise<boolean>;
  unlockSeats: () => Promise<void>;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const MAX_SEATS = 6;
const LOCK_DURATION = 5 * 60; // 5 minutes in seconds

export function BookingProvider({ children }: { children: ReactNode }) {
  const [show, setShow] = useState<Show | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [lockExpiresAt, setLockExpiresAt] = useState<Date | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isLocking, setIsLocking] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Calculate total price
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  // Timer countdown effect
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
        // Lock expired
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
  }, []);

  const selectSeat = useCallback((seat: Seat) => {
    setSelectedSeats((prev) => {
      if (prev.length >= MAX_SEATS) return prev;
      if (prev.some((s) => s.id === seat.id)) return prev;
      return [...prev, seat];
    });
  }, []);

  const deselectSeat = useCallback((seatId: string) => {
    setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSeats([]);
    setIsLocked(false);
    setLockExpiresAt(null);
  }, []);

  const lockSeats = useCallback(async (): Promise<boolean> => {
    if (!show || selectedSeats.length === 0) return false;

    setIsLocking(true);
    try {
      const response = await api.post<{ expiresAt: string }>('/bookings/lock-multiple', {
        showId: show._id,
        seatIds: selectedSeats.map((s) => s.id),
      });

      const expiresAt = new Date(response.expiresAt);
      setLockExpiresAt(expiresAt);
      setIsLocked(true);
      return true;
    } catch (error) {
      console.error('Failed to lock seats:', error);
      return false;
    } finally {
      setIsLocking(false);
    }
  }, [show, selectedSeats]);

  const unlockSeats = useCallback(async () => {
    if (!show || selectedSeats.length === 0) return;

    try {
      await api.post('/bookings/unlock', {
        showId: show._id,
        seatIds: selectedSeats.map((s) => s.id),
      });
    } catch (error) {
      console.error('Failed to unlock seats:', error);
    } finally {
      setIsLocked(false);
      setLockExpiresAt(null);
    }
  }, [show, selectedSeats]);

  const resetBooking = useCallback(() => {
    setShow(null);
    setSelectedSeats([]);
    setLockExpiresAt(null);
    setIsLocked(false);
  }, []);

  return (
    <BookingContext.Provider
      value={{
        show,
        selectedSeats,
        totalPrice,
        lockExpiresAt,
        remainingSeconds,
        isLocking,
        isLocked,
        maxSeats: MAX_SEATS,
        setShow,
        selectSeat,
        deselectSeat,
        clearSelection,
        lockSeats,
        unlockSeats,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
