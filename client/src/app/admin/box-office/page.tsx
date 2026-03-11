'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

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

interface PaymentMethod {
  id: string;
  name: string;
  icon: JSX.Element;
}

// ============================================================================
// SHOW SELECTION COMPONENT
// ============================================================================

interface ShowSelectionProps {
  shows: Show[];
  selectedShowId: string;
  onSelect: (showId: string) => void;
}

const ShowSelection: React.FC<ShowSelectionProps> = ({ shows, selectedShowId, onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {shows.map(show => {
        const occupancy = Math.round(((show.totalSeats - show.availableSeats) / show.totalSeats) * 100);
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
              <span className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                occupancy >= 80 ? 'bg-red-500/20 text-red-400' :
                occupancy >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              )}>
                {show.availableSeats} left
              </span>
            </div>
            <p className="text-gray-300 font-medium truncate">{show.movieTitle}</p>
            <p className="text-gray-500 text-sm">{show.screen}</p>
            <p className="text-primary-400 text-sm mt-1">From ₹{show.basePrice}</p>
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// QUICK SEAT MAP COMPONENT
// ============================================================================

interface QuickSeatMapProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatClick: (seatId: string) => void;
}

const QuickSeatMap: React.FC<QuickSeatMapProps> = ({ seats, selectedSeats, onSeatClick }) => {
  const rows = useMemo(() => {
    const grouped: Record<string, Seat[]> = {};
    seats.forEach(seat => {
      if (!grouped[seat.row]) grouped[seat.row] = [];
      grouped[seat.row].push(seat);
    });
    // Sort each row by seat number
    Object.values(grouped).forEach(row => row.sort((a, b) => a.number - b.number));
    return grouped;
  }, [seats]);

  const rowLabels = Object.keys(rows).sort();

  const categoryColors: Record<string, string> = {
    standard: 'bg-blue-500',
    premium: 'bg-purple-500',
    vip: 'bg-yellow-500',
    recliner: 'bg-green-500',
  };

  return (
    <div className="space-y-4">
      {/* Screen indicator */}
      <div className="flex justify-center mb-6">
        <div className="w-3/4 h-2 bg-gradient-to-r from-transparent via-primary-500 to-transparent rounded-full" />
      </div>
      <p className="text-center text-gray-500 text-xs mb-4">SCREEN</p>

      {/* Seats */}
      <div className="flex flex-col items-center gap-2">
        {rowLabels.map(rowLabel => (
          <div key={rowLabel} className="flex items-center gap-2">
            <span className="w-6 text-gray-500 text-sm text-right">{rowLabel}</span>
            <div className="flex gap-1">
              {rows[rowLabel].map(seat => {
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
                        : `${categoryColors[seat.category]} hover:ring-2 hover:ring-white/30 text-white`
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

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-6 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-blue-500" />
          <span className="text-gray-400">Standard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-purple-500" />
          <span className="text-gray-400">Premium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-yellow-500" />
          <span className="text-gray-400">VIP</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-gray-700" />
          <span className="text-gray-400">Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-primary-500" />
          <span className="text-gray-400">Selected</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CART COMPONENT
// ============================================================================

interface CartProps {
  items: CartItem[];
  onRemove: (seatId: string) => void;
  onClear: () => void;
}

const Cart: React.FC<CartProps> = ({ items, onRemove, onClear }) => {
  const total = items.reduce((sum, item) => sum + item.price, 0);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p>No seats selected</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Selected Seats ({items.length})</h3>
        <button
          onClick={onClear}
          className="text-red-400 text-sm hover:text-red-300"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.map(item => (
          <div
            key={item.seatId}
            className="flex items-center justify-between p-2 bg-surface-active rounded-lg"
          >
            <div>
              <span className="text-white font-medium">{item.seatLabel}</span>
              <span className="text-gray-500 text-sm ml-2">({item.category})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-400">₹{item.price}</span>
              <button
                onClick={() => onRemove(item.seatId)}
                className="p-1 text-gray-400 hover:text-red-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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

// ============================================================================
// CUSTOMER FORM COMPONENT
// ============================================================================

interface CustomerFormProps {
  customer: Customer;
  onChange: (customer: Customer) => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Customer Name</label>
        <input
          type="text"
          value={customer.name}
          onChange={(e) => onChange({ ...customer, name: e.target.value })}
          placeholder="Enter name"
          className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Phone Number*</label>
        <input
          type="tel"
          value={customer.phone}
          onChange={(e) => onChange({ ...customer, phone: e.target.value })}
          placeholder="Enter phone number"
          className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Email (optional)</label>
        <input
          type="email"
          value={customer.email}
          onChange={(e) => onChange({ ...customer, email: e.target.value })}
          placeholder="Enter email"
          className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
        />
      </div>
    </div>
  );
};

// ============================================================================
// PAYMENT SECTION COMPONENT
// ============================================================================

interface PaymentSectionProps {
  total: number;
  selectedMethod: string;
  onMethodSelect: (methodId: string) => void;
  onComplete: () => void;
  isProcessing: boolean;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  total,
  selectedMethod,
  onMethodSelect,
  onComplete,
  isProcessing,
}) => {
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'cash',
      name: 'Cash',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'card',
      name: 'Card',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'comp',
      name: 'Complimentary',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold">Payment Method</h3>

      <div className="grid grid-cols-2 gap-3">
        {paymentMethods.map(method => (
          <button
            key={method.id}
            onClick={() => onMethodSelect(method.id)}
            className={cn(
              'p-4 rounded-xl flex flex-col items-center gap-2 transition-all',
              selectedMethod === method.id
                ? 'bg-primary-500/20 border-2 border-primary-500'
                : 'bg-surface-active border-2 border-transparent hover:border-gray-600'
            )}
          >
            <span className={selectedMethod === method.id ? 'text-primary-400' : 'text-gray-400'}>
              {method.icon}
            </span>
            <span className={cn(
              'text-sm font-medium',
              selectedMethod === method.id ? 'text-white' : 'text-gray-400'
            )}>
              {method.name}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-surface-active rounded-xl p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Subtotal</span>
          <span className="text-white">₹{total}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Convenience Fee</span>
          <span className="text-white">₹0</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">GST (18%)</span>
          <span className="text-white">₹{Math.round(total * 0.18)}</span>
        </div>
        <div className="pt-3 border-t border-gray-700 flex justify-between">
          <span className="text-white font-bold">Grand Total</span>
          <span className="text-primary-400 font-bold text-lg">
            ₹{Math.round(total * 1.18)}
          </span>
        </div>
      </div>

      <button
        onClick={onComplete}
        disabled={!selectedMethod || isProcessing}
        className={cn(
          'w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2',
          selectedMethod && !isProcessing
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        )}
      >
        {isProcessing ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Complete Booking
          </>
        )}
      </button>
    </div>
  );
};

// ============================================================================
// SUCCESS MODAL COMPONENT
// ============================================================================

interface SuccessModalProps {
  bookingId: string;
  seats: string[];
  total: number;
  onNewBooking: () => void;
  onPrint: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ bookingId, seats, total, onNewBooking, onPrint }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" />
      
      <div className="relative bg-surface-card rounded-2xl border border-gray-800 w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
        <p className="text-gray-400 mb-6">Tickets have been successfully booked</p>

        <div className="bg-surface-active rounded-xl p-4 mb-6 text-left">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Booking ID</span>
            <span className="text-white font-mono">{bookingId}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Seats</span>
            <span className="text-white">{seats.join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Amount Paid</span>
            <span className="text-green-400 font-bold">₹{total}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onPrint}
            className="flex-1 py-3 bg-surface-active border border-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            onClick={onNewBooking}
            className="flex-1 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Booking
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function BoxOfficePage() {
  const [step, setStep] = useState<'show' | 'seats' | 'checkout'>('show');
  const [selectedShowId, setSelectedShowId] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState('');

  // Mock data
  const shows: Show[] = [
    { id: 's1', movieTitle: 'Pushpa 2: The Rule', time: '09:30', endTime: '12:45', screen: 'Screen 1 (IMAX)', availableSeats: 45, totalSeats: 200, basePrice: 350 },
    { id: 's2', movieTitle: 'Pushpa 2: The Rule', time: '14:00', endTime: '17:15', screen: 'Screen 1 (IMAX)', availableSeats: 12, totalSeats: 200, basePrice: 400 },
    { id: 's3', movieTitle: 'Avatar 3', time: '10:00', endTime: '13:00', screen: 'Screen 2', availableSeats: 78, totalSeats: 150, basePrice: 300 },
    { id: 's4', movieTitle: 'KGF Chapter 3', time: '18:30', endTime: '21:30', screen: 'Screen 1 (IMAX)', availableSeats: 0, totalSeats: 200, basePrice: 450 },
    { id: 's5', movieTitle: 'RRR 2', time: '11:00', endTime: '14:15', screen: 'Screen 3', availableSeats: 95, totalSeats: 120, basePrice: 250 },
    { id: 's6', movieTitle: 'Inception 2', time: '21:00', endTime: '23:45', screen: 'Screen 2', availableSeats: 65, totalSeats: 150, basePrice: 350 },
  ];

  const seats: Seat[] = useMemo(() => {
    const result: Seat[] = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    rows.forEach((row, rowIndex) => {
      const seatsInRow = 12;
      for (let i = 1; i <= seatsInRow; i++) {
        let category = 'standard';
        let price = 250;
        
        if (rowIndex >= 6) {
          category = 'vip';
          price = 500;
        } else if (rowIndex >= 4) {
          category = 'premium';
          price = 350;
        }
        
        const status = Math.random() > 0.7 ? 'booked' : 'available';
        
        result.push({
          id: `${row}${i}`,
          row,
          number: i,
          category,
          price,
          status: status as Seat['status'],
        });
      }
    });
    
    return result;
  }, [selectedShowId]);

  const cartItems: CartItem[] = useMemo(() => {
    return selectedSeats.map(seatId => {
      const seat = seats.find(s => s.id === seatId)!;
      return {
        seatId: seat.id,
        seatLabel: `${seat.row}${seat.number}`,
        category: seat.category,
        price: seat.price,
      };
    });
  }, [selectedSeats, seats]);

  const total = cartItems.reduce((sum, item) => sum + item.price, 0);
  const selectedShow = shows.find(s => s.id === selectedShowId);

  const handleSeatClick = useCallback((seatId: string) => {
    setSelectedSeats(prev => 
      prev.includes(seatId)
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    );
  }, []);

  const handleCompleteBooking = async () => {
    if (!customer.phone) {
      alert('Please enter customer phone number');
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newBookingId = `BOX${Date.now().toString(36).toUpperCase()}`;
    setBookingId(newBookingId);
    setIsProcessing(false);
    setBookingComplete(true);
  };

  const handleNewBooking = () => {
    setStep('show');
    setSelectedShowId('');
    setSelectedSeats([]);
    setCustomer({ name: '', phone: '', email: '' });
    setPaymentMethod('');
    setBookingComplete(false);
    setBookingId('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="bg-surface-card border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Box Office</h1>
            <p className="text-gray-400 text-sm">Walk-in ticket booking system</p>
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
              <p className="text-primary-400 font-bold">47</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        {selectedShowId && (
          <div className="flex items-center gap-4 mt-4">
            {['show', 'seats', 'checkout'].map((s, index) => (
              <React.Fragment key={s}>
                <button
                  onClick={() => {
                    if (s === 'show' || (s === 'seats' && selectedShowId) || (s === 'checkout' && selectedSeats.length > 0)) {
                      setStep(s as typeof step);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    step === s
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-active text-gray-400 hover:text-white'
                  )}
                >
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
                {index < 2 && <span className="text-gray-600">→</span>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
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
              shows={shows.filter(s => s.availableSeats > 0)}
              selectedShowId={selectedShowId}
              onSelect={(id) => {
                setSelectedShowId(id);
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
                <button
                  onClick={() => setStep('show')}
                  className="text-primary-400 text-sm hover:text-primary-300"
                >
                  Change Show
                </button>
              </div>
              <QuickSeatMap
                seats={seats}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatClick}
              />
            </div>

            <div className="space-y-4">
              <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
                <Cart
                  items={cartItems}
                  onRemove={(seatId) => setSelectedSeats(prev => prev.filter(id => id !== seatId))}
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
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Movie</span>
                    <span className="text-white">{selectedShow.movieTitle}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Show Time</span>
                    <span className="text-white">{selectedShow.time}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Screen</span>
                    <span className="text-white">{selectedShow.screen}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Seats</span>
                    <span className="text-white">{cartItems.map(i => i.seatLabel).join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
                <h3 className="text-white font-semibold mb-4">Customer Details</h3>
                <CustomerForm customer={customer} onChange={setCustomer} />
              </div>
            </div>

            <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
              <PaymentSection
                total={total}
                selectedMethod={paymentMethod}
                onMethodSelect={setPaymentMethod}
                onComplete={handleCompleteBooking}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {bookingComplete && (
        <SuccessModal
          bookingId={bookingId}
          seats={cartItems.map(i => i.seatLabel)}
          total={Math.round(total * 1.18)}
          onNewBooking={handleNewBooking}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
}
