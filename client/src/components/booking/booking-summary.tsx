'use client';

import { motion } from 'framer-motion';
import { X, MapPin, Calendar, Clock } from 'lucide-react';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import type { Event, Show, Venue } from '@/types';
import type { Seat } from '@/types/seat';

interface BookingSummaryProps {
  event: Event;
  show: Show;
  venue: Venue;
  selectedSeats: Seat[];
  onRemoveSeat?: (seatId: string) => void;
  showRemove?: boolean;
  convenienceFee?: number;
  taxes?: number;
}

export function BookingSummary({
  event,
  show,
  venue,
  selectedSeats,
  onRemoveSeat,
  showRemove = false,
  convenienceFee = 0,
  taxes = 0,
}: BookingSummaryProps) {
  const subtotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const total = subtotal + convenienceFee + taxes;

  return (
    <div className="card overflow-hidden">
      {/* Event Info */}
      <div className="flex gap-4 p-4 border-b border-border">
        <img
          src={event.posterUrl}
          alt={event.title}
          className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
        />
        <div className="min-w-0">
          <h3 className="font-semibold text-white text-lg truncate">{event.title}</h3>
          <p className="text-sm text-gray-400 mt-1">
            {event.certificate} • {event.language.join(', ')}
          </p>
          <div className="flex items-center gap-1 text-sm text-gray-400 mt-2">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{venue.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(show.showTime)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(show.showTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Selected Seats */}
      <div className="p-4 border-b border-border">
        <h4 className="text-sm font-medium text-gray-400 mb-3">
          Selected Seats ({selectedSeats.length})
        </h4>
        <div className="space-y-2">
          {selectedSeats.map((seat) => (
            <motion.div
              key={seat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center justify-between py-2 px-3 bg-surface-hover rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-white">{seat.label}</span>
                <span className="text-xs text-gray-400 capitalize px-2 py-0.5 bg-surface-active rounded">
                  {seat.category}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-300">{formatCurrency(seat.price)}</span>
                {showRemove && onRemoveSeat && (
                  <button
                    onClick={() => onRemoveSeat(seat.id)}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Subtotal</span>
          <span className="text-gray-300">{formatCurrency(subtotal)}</span>
        </div>
        {convenienceFee > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Convenience Fee</span>
            <span className="text-gray-300">{formatCurrency(convenienceFee)}</span>
          </div>
        )}
        {taxes > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Taxes & Fees</span>
            <span className="text-gray-300">{formatCurrency(taxes)}</span>
          </div>
        )}
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <span className="font-medium text-white">Total Amount</span>
          <span className="text-xl font-bold text-primary-400">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
