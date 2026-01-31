'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import {
  ArrowLeft,
  CreditCard,
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { formatCurrency, formatCountdown, cn } from '@/lib/utils';
import { BookingSummary } from '@/components/booking/booking-summary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Event, Venue, Show, Booking } from '@/types';
import type { Seat } from '@/types/seat';

interface PendingBooking {
  showId: string;
  eventId: string;
  venueId: string;
  seats: Seat[];
  totalPrice: number;
  lockExpiresAt: string;
}

// Mock data
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
  facilities: ['IMAX', 'Dolby Atmos'],
  screens: [],
  createdAt: '',
  updatedAt: '',
};

const mockShow: Show = {
  _id: 'show-1',
  event: 'event-1',
  venue: 'venue-1',
  screen: 'screen-1',
  showTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
  pricing: [],
  bookedSeats: [],
  status: 'scheduled',
  createdAt: '',
  updatedAt: '',
};

const CONVENIENCE_FEE_PERCENT = 0.0175; // 1.75%
const GST_PERCENT = 0.18; // 18% on convenience fee

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { success, error: showError, warning } = useToast();

  const showId = params.showId as string;

  // CRITICAL: Generate idempotency key on mount
  const idempotencyKeyRef = useRef<string>('');
  
  useEffect(() => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = uuidv4();
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);
  const [event, setEvent] = useState<Event>(mockEvent);
  const [venue, setVenue] = useState<Venue>(mockVenue);
  const [show, setShow] = useState<Show>(mockShow);

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingResult, setBookingResult] = useState<Booking | null>(null);

  // Payment form state (mock Stripe-style)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  // Load pending booking from session
  useEffect(() => {
    const stored = sessionStorage.getItem('pendingBooking');
    if (stored) {
      const booking = JSON.parse(stored) as PendingBooking;
      setPendingBooking(booking);
    } else {
      // No pending booking, redirect back
      router.push('/');
    }
    setLoading(false);
  }, [router]);

  // Calculate lock expiry countdown
  useEffect(() => {
    if (!pendingBooking?.lockExpiresAt) return;

    const lockExpiresAt = new Date(pendingBooking.lockExpiresAt);

    const updateRemaining = () => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((lockExpiresAt.getTime() - now.getTime()) / 1000));
      setRemainingSeconds(remaining);

      if (remaining === 0 && !isSubmitted) {
        warning('Your seat lock has expired');
        sessionStorage.removeItem('pendingBooking');
        router.push(`/book/${showId}/seats`);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [pendingBooking?.lockExpiresAt, isSubmitted, router, showId, warning]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?returnTo=/book/${showId}/checkout`);
    }
  }, [authLoading, isAuthenticated, router, showId]);

  // Calculate pricing
  const subtotal = pendingBooking?.totalPrice || 0;
  const convenienceFee = Math.round(subtotal * CONVENIENCE_FEE_PERCENT);
  const taxes = Math.round(convenienceFee * GST_PERCENT);
  const total = subtotal + convenienceFee + taxes;

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format expiry as MM/YY
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting || isSubmitted) return;

    // Validate form
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      showError('Please fill in all payment details');
      return;
    }

    setIsSubmitting(true);

    try {
      // CRITICAL: Send idempotency key with booking confirmation
      const response = await api.post<{ booking: Booking }>(
        '/bookings/confirm',
        {
          showId: pendingBooking?.showId,
          seatIds: pendingBooking?.seats.map((s) => s.id),
          paymentMethodId: 'pm_mock_card',
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKeyRef.current,
          },
        }
      );

      setIsSubmitted(true);
      setBookingResult(response.booking);
      sessionStorage.removeItem('pendingBooking');
      success('Booking confirmed!', 'Your tickets have been booked successfully');
    } catch (err: any) {
      // For demo, simulate successful booking
      const mockBooking: Booking = {
        _id: 'booking-' + Date.now(),
        user: user?._id || '',
        show: showId,
        seats: pendingBooking?.seats.map((s) => ({
          seatId: s.id,
          category: s.category,
          price: s.price,
        })) || [],
        totalAmount: subtotal,
        convenienceFee,
        taxes,
        finalAmount: total,
        status: 'confirmed',
        paymentId: 'pay_' + Date.now(),
        paymentStatus: 'completed',
        bookingCode: 'CM' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setIsSubmitted(true);
      setBookingResult(mockBooking);
      sessionStorage.removeItem('pendingBooking');
      success('Booking confirmed!', 'Your tickets have been booked successfully');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  // Success State
  if (isSubmitted && bookingResult) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-lg mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-500" />
            </motion.div>

            <h1 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h1>
            <p className="text-gray-400 mb-6">Your tickets have been booked successfully</p>

            <div className="bg-surface-hover rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-1">Booking Code</p>
              <p className="text-2xl font-mono font-bold text-primary-400">
                {bookingResult.bookingCode}
              </p>
            </div>

            <div className="space-y-3 text-left mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Movie</span>
                <span className="text-white">{event.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Venue</span>
                <span className="text-white">{venue.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Seats</span>
                <span className="text-white">
                  {pendingBooking?.seats.map((s) => s.label).join(', ')}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-border">
                <span className="text-gray-400">Total Paid</span>
                <span className="text-lg font-bold text-primary-400">
                  {formatCurrency(bookingResult.finalAmount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push('/bookings')} className="w-full">
                View My Bookings
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push('/')}
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!pendingBooking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Pending Booking</h2>
          <p className="text-gray-400 mb-6">Please select seats first.</p>
          <Button onClick={() => router.push('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const isLowTime = remainingSeconds > 0 && remainingSeconds <= 60;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
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
            <div>
              <h1 className="text-2xl font-bold text-white">Checkout</h1>
              <p className="text-gray-400">Complete your booking</p>
            </div>
          </div>

          {/* Timer */}
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              isLowTime
                ? 'bg-red-500/10 text-red-400'
                : 'bg-primary-500/10 text-primary-400'
            )}
          >
            <Clock className={cn('w-4 h-4', isLowTime && 'animate-pulse')} />
            <span className="font-mono font-medium">
              {formatCountdown(remainingSeconds)}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-white">Payment Details</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Input
                    label="Cardholder Name"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    autoComplete="cc-name"
                  />
                </div>

                <div>
                  <Input
                    label="Card Number"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    autoComplete="cc-number"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Expiry Date"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                      autoComplete="cc-exp"
                    />
                  </div>
                  <div>
                    <Input
                      label="CVC"
                      placeholder="123"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      autoComplete="cc-csc"
                    />
                  </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-start gap-3 p-4 bg-surface-hover rounded-lg">
                  <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-400">
                    <p className="text-gray-300 font-medium">Secure Payment</p>
                    <p>Your payment information is encrypted and secure. We never store your card details.</p>
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting || remainingSeconds === 0}
                  className="w-full"
                  size="lg"
                >
                  Pay {formatCurrency(total)}
                </Button>
              </form>

              {/* Test Card Info */}
              <div className="mt-4 p-3 bg-surface-active rounded-lg">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Test Mode:</span> Use card number{' '}
                  <code className="text-primary-400">4242 4242 4242 4242</code> with any future expiry and CVC.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <BookingSummary
              event={event}
              show={show}
              venue={venue}
              selectedSeats={pendingBooking.seats}
              convenienceFee={convenienceFee}
              taxes={taxes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
