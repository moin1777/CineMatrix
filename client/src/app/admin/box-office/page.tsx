'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';

interface Show {
  id: string;
  movieTitle: string;
  time: string;
  endTime: string;
  screen: string;
  availableSeats: number;
  totalSeats: number;
  basePrice: number;
}

interface Seat {
  id: string;
  row: string;
  number: number;
  category: string;
  price: number;
  status: 'available' | 'booked' | 'selected' | 'blocked';
}

interface CartItem {
  seatId: string;
  seatLabel: string;
  category: string;
  price: number;
}

interface Customer {
  name: string;
  phone: string;
  email: string;
}

interface AdminShowsResponse {
  items: Array<{
    id: string;
    movieTitle: string;
    time: string;
    endTimeLabel: string;
    screen: string;
    bookedSeats: number;
    totalSeats: number;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  }>;
}

interface SeatApiResponse {
  allSeats: Array<{
    row: string;
    number: number;
    type: string;
    price: number;
    seatId: string;
    isAvailable: boolean;
    isBooked: boolean;
    isLocked: boolean;
  }>;
  availableCount: number;
  totalSeats: number;
}

interface BookingStatsResponse {
  todayBookings: number;
}

const ShowSelection = ({
  shows,
  selectedShowId,
  onSelect
}: {
  shows: Show[];
  selectedShowId: string;
  onSelect: (showId: string) => void;
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {shows.map((show) => {
      const occupancy = Math.round(((show.totalSeats - show.availableSeats) / Math.max(show.totalSeats, 1)) * 100);
      const isSelected = show.id === selectedShowId;

      return (
        <button
          key={show.id}
          onClick={() => onSelect(show.id)}
          className={cn(
            'p-4 rounded-xl text-left transition-all',
            isSelected
              ? 'bg-primary-500/20 border-2 border-primary-500 ring-2 ring-primary-500/20'
              : 'bg-surface-active border-2 border-transparent hover:border-gray-600'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-white">{show.time}</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                occupancy >= 80
                  ? 'bg-red-500/20 text-red-400'
                  : occupancy >= 50
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-green-500/20 text-green-400'
              )}
            >
              {show.availableSeats} left
            </span>
          </div>
          <p className="text-gray-300 font-medium truncate">{show.movieTitle}</p>
          <p className="text-gray-500 text-sm">{show.screen}</p>
          <p className="text-primary-400 text-sm mt-1">From ₹{show.basePrice}</p>
          <p className="text-gray-500 text-xs mt-1">Ends {show.endTime}</p>
        </button>
      );
    })}
  </div>
);

const QuickSeatMap = ({
  seats,
  selectedSeats,
  onSeatClick
}: {
  seats: Seat[];
  selectedSeats: string[];
  onSeatClick: (seatId: string) => void;
}) => {
  const rows = useMemo(() => {
    const grouped: Record<string, Seat[]> = {};
    seats.forEach((seat) => {
      if (!grouped[seat.row]) grouped[seat.row] = [];
      grouped[seat.row].push(seat);
    });
    Object.values(grouped).forEach((row) => row.sort((a, b) => a.number - b.number));
    return grouped;
  }, [seats]);

  const rowLabels = Object.keys(rows).sort();

  const categoryColors: Record<string, string> = {
    regular: 'bg-blue-500',
    standard: 'bg-blue-500',
    premium: 'bg-purple-500',
    vip: 'bg-yellow-500',
    wheelchair: 'bg-green-500'
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center mb-6">
        <div className="w-3/4 h-2 bg-gradient-to-r from-transparent via-primary-500 to-transparent rounded-full" />
      </div>
      <p className="text-center text-gray-500 text-xs mb-4">SCREEN</p>

      <div className="flex flex-col items-center gap-2">
        {rowLabels.map((rowLabel) => (
          <div key={rowLabel} className="flex items-center gap-2">
            <span className="w-6 text-gray-500 text-sm text-right">{rowLabel}</span>
            <div className="flex gap-1">
              {rows[rowLabel].map((seat) => {
                const isSelected = selectedSeats.includes(seat.id);
                const isAvailable = seat.status === 'available';

                return (
                  <button
                    key={seat.id}
                    onClick={() => isAvailable && onSeatClick(seat.id)}
                    disabled={!isAvailable && !isSelected}
                    className={cn(
                      'w-7 h-7 rounded text-xs font-medium transition-all',
                      isSelected
                        ? 'bg-primary-500 text-white ring-2 ring-primary-400'
                        : seat.status === 'booked'
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : seat.status === 'blocked'
                        ? 'bg-red-900/50 text-red-500 cursor-not-allowed'
                        : `${categoryColors[seat.category] || 'bg-blue-500'} hover:ring-2 hover:ring-white/30 text-white`
                    )}
                    title={`${seat.row}${seat.number} - ${seat.category} - ₹${seat.price}`}
                  >
                    {seat.number}
                  </button>
                );
              })}
            </div>
            <span className="w-6 text-gray-500 text-sm">{rowLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Cart = ({
  items,
  onRemove,
  onClear
}: {
  items: CartItem[];
  onRemove: (seatId: string) => void;
  onClear: () => void;
}) => {
  const total = items.reduce((sum, item) => sum + item.price, 0);

  if (items.length === 0) {
    return <div className="text-center py-8 text-gray-500">No seats selected</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Selected Seats ({items.length})</h3>
        <button onClick={onClear} className="text-red-400 text-sm hover:text-red-300">
          Clear All
        </button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <div key={item.seatId} className="flex items-center justify-between p-2 bg-surface-active rounded-lg">
            <div>
              <span className="text-white font-medium">{item.seatLabel}</span>
              <span className="text-gray-500 text-sm ml-2">({item.category})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-400">₹{item.price}</span>
              <button onClick={() => onRemove(item.seatId)} className="p-1 text-gray-400 hover:text-red-400">
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-lg font-bold">
          <span className="text-white">Total</span>
          <span className="text-primary-400">₹{total}</span>
        </div>
      </div>
    </div>
  );
};

export default function BoxOfficePage() {
  const { isAuthenticated, isLoading } = useAuth();

  const [step, setStep] = useState<'show' | 'seats' | 'checkout'>('show');
  const [selectedShowId, setSelectedShowId] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingCode, setBookingCode] = useState('');
  const [todayBookings, setTodayBookings] = useState(0);

  const [shows, setShows] = useState<Show[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loadingShows, setLoadingShows] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);

  const selectedShow = shows.find((show) => show.id === selectedShowId);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const loadShowsAndStats = async () => {
      try {
        setLoadingShows(true);
        setPageError(null);

        const today = new Date().toISOString().split('T')[0];
        const [showsResponse, statsResponse] = await Promise.all([
          api.get<AdminShowsResponse>(`/admin/shows?page=1&limit=100&status=all&venue=all&from=${today}&to=${today}`),
          api.get<BookingStatsResponse>('/bookings/stats/overview')
        ]);

        const mappedShows = (showsResponse.items || [])
          .filter((item) => item.status === 'scheduled' || item.status === 'ongoing')
          .map((item) => ({
            id: item.id,
            movieTitle: item.movieTitle,
            time: item.time,
            endTime: item.endTimeLabel,
            screen: item.screen,
            availableSeats: Math.max(item.totalSeats - item.bookedSeats, 0),
            totalSeats: item.totalSeats,
            basePrice: 250
          }));

        setShows(mappedShows);
        setTodayBookings(statsResponse.todayBookings || 0);
      } catch (error: any) {
        setPageError(error?.message || 'Failed to load box-office data');
      } finally {
        setLoadingShows(false);
      }
    };

    loadShowsAndStats();
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (!selectedShowId) {
      setSeats([]);
      return;
    }

    const loadSeats = async () => {
      try {
        setLoadingSeats(true);
        setPageError(null);

        const seatResponse = await api.get<SeatApiResponse>(`/events/shows/${selectedShowId}/seats`);
        const mappedSeats: Seat[] = (seatResponse.allSeats || []).map((seat) => ({
          id: seat.seatId,
          row: seat.row,
          number: seat.number,
          category: seat.type || 'regular',
          price: seat.price,
          status: seat.isBooked ? 'booked' : seat.isLocked ? 'blocked' : 'available'
        }));

        setSeats(mappedSeats);
      } catch (error: any) {
        setPageError(error?.message || 'Failed to load seats');
      } finally {
        setLoadingSeats(false);
      }
    };

    loadSeats();
  }, [selectedShowId]);

  const cartItems: CartItem[] = useMemo(() => {
    return selectedSeats
      .map((seatId) => {
        const seat = seats.find((item) => item.id === seatId);
        if (!seat) return null;
        return {
          seatId: seat.id,
          seatLabel: `${seat.row}${seat.number}`,
          category: seat.category,
          price: seat.price
        };
      })
      .filter(Boolean) as CartItem[];
  }, [selectedSeats, seats]);

  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  const handleSeatClick = (seatId: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((item) => item !== seatId) : [...prev, seatId]
    );
  };

  const handleCompleteBooking = async () => {
    if (!selectedShowId || selectedSeats.length === 0) return;
    if (!customer.phone.trim()) {
      setPageError('Customer phone number is required');
      return;
    }

    try {
      setIsProcessing(true);
      setPageError(null);

      const response = await api.post<{ booking?: { bookingCode?: string } }>(
        '/bookings/confirm',
        {
          showId: selectedShowId,
          seats: selectedSeats,
          paymentToken: `box-office-${paymentMethod}-${Date.now()}`
        },
        {
          headers: {
            'idempotency-key': `box-office-${selectedShowId}-${selectedSeats.slice().sort().join('-')}`
          }
        }
      );

      setBookingCode(response.booking?.bookingCode || 'N/A');
      setBookingComplete(true);
      setTodayBookings((prev) => prev + 1);
    } catch (error: any) {
      setPageError(error?.message || 'Failed to confirm booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewBooking = () => {
    setStep('show');
    setSelectedShowId('');
    setSelectedSeats([]);
    setCustomer({ name: '', phone: '', email: '' });
    setPaymentMethod('cash');
    setBookingComplete(false);
    setBookingCode('');
  };

  if (isLoading || loadingShows) {
    return <div className="h-40 bg-surface-card rounded-xl border border-gray-800 animate-pulse" />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="bg-surface-card border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Box Office</h1>
            <p className="text-gray-400 text-sm">Walk-in ticket booking system (live)</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Current Time</p>
              <p className="text-white font-mono">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Today's Bookings</p>
              <p className="text-primary-400 font-bold">{todayBookings}</p>
            </div>
          </div>
        </div>
      </div>

      {pageError && (
        <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
          {pageError}
        </div>
      )}

      <div className="flex-1 p-6">
        {step === 'show' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Select Show</h2>
              <p className="text-gray-400 text-sm">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <ShowSelection
              shows={shows.filter((show) => show.availableSeats > 0)}
              selectedShowId={selectedShowId}
              onSelect={(showId) => {
                setSelectedShowId(showId);
                setSelectedSeats([]);
                setStep('seats');
              }}
            />
          </div>
        )}

        {step === 'seats' && selectedShow && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-surface-card rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedShow.movieTitle}</h2>
                  <p className="text-gray-400 text-sm">
                    {selectedShow.time} - {selectedShow.endTime} • {selectedShow.screen}
                  </p>
                </div>
                <button onClick={() => setStep('show')} className="text-primary-400 text-sm hover:text-primary-300">
                  Change Show
                </button>
              </div>

              {loadingSeats ? (
                <div className="h-48 bg-surface-active rounded-lg animate-pulse" />
              ) : (
                <QuickSeatMap seats={seats} selectedSeats={selectedSeats} onSeatClick={handleSeatClick} />
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
                <Cart
                  items={cartItems}
                  onRemove={(seatId) => setSelectedSeats((prev) => prev.filter((item) => item !== seatId))}
                  onClear={() => setSelectedSeats([])}
                />
              </div>

              {selectedSeats.length > 0 && (
                <button
                  onClick={() => setStep('checkout')}
                  className="w-full py-4 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors"
                >
                  Proceed to Checkout →
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'checkout' && selectedShow && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="space-y-6">
              <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
                <h3 className="text-white font-semibold mb-4">Booking Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Movie</span><span className="text-white">{selectedShow.movieTitle}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Show Time</span><span className="text-white">{selectedShow.time}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Screen</span><span className="text-white">{selectedShow.screen}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Seats</span><span className="text-white">{cartItems.map((item) => item.seatLabel).join(', ')}</span></div>
                </div>
              </div>

              <div className="bg-surface-card rounded-xl border border-gray-800 p-4 space-y-4">
                <h3 className="text-white font-semibold">Customer Details</h3>
                <input
                  value={customer.name}
                  onChange={(event) => setCustomer((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Customer name"
                  className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white placeholder-gray-500"
                />
                <input
                  value={customer.phone}
                  onChange={(event) => setCustomer((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="Phone number *"
                  className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white placeholder-gray-500"
                />
                <input
                  value={customer.email}
                  onChange={(event) => setCustomer((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Email (optional)"
                  className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div className="bg-surface-card rounded-xl border border-gray-800 p-4 space-y-4">
              <h3 className="text-white font-semibold">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                {['cash', 'card', 'upi', 'comp'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      'p-3 rounded-lg border transition-colors capitalize',
                      paymentMethod === method
                        ? 'border-primary-500 bg-primary-500/20 text-white'
                        : 'border-gray-700 bg-surface-active text-gray-400'
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>

              <div className="bg-surface-active rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span className="text-white">₹{total}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Convenience Fee</span><span className="text-white">₹0</span></div>
                <div className="flex justify-between"><span className="text-gray-400">GST (18%)</span><span className="text-white">₹{Math.round(total * 0.18)}</span></div>
                <div className="pt-2 border-t border-gray-700 flex justify-between"><span className="text-white font-bold">Grand Total</span><span className="text-primary-400 font-bold">₹{Math.round(total * 1.18)}</span></div>
              </div>

              <button
                onClick={handleCompleteBooking}
                disabled={isProcessing || selectedSeats.length === 0}
                className={cn(
                  'w-full py-4 rounded-xl font-bold transition-colors',
                  !isProcessing && selectedSeats.length > 0
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                )}
              >
                {isProcessing ? 'Processing...' : 'Complete Booking'}
              </button>
            </div>
          </div>
        )}
      </div>

      {bookingComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative bg-surface-card rounded-2xl border border-gray-800 w-full max-w-md p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
            <p className="text-gray-400 mb-6">Tickets have been successfully booked</p>

            <div className="bg-surface-active rounded-xl p-4 mb-6 text-left">
              <div className="flex justify-between mb-2"><span className="text-gray-400">Booking Code</span><span className="text-white font-mono">{bookingCode}</span></div>
              <div className="flex justify-between mb-2"><span className="text-gray-400">Seats</span><span className="text-white">{cartItems.map((item) => item.seatLabel).join(', ')}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Amount Paid</span><span className="text-green-400 font-bold">₹{Math.round(total * 1.18)}</span></div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => window.print()} className="flex-1 py-3 bg-surface-active border border-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Print
              </button>
              <button onClick={handleNewBooking} className="flex-1 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                New Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
