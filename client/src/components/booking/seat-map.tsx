'use client';

import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn, generateSeatLabel } from '@/lib/utils';
import type { Seat, SeatSectionConfig } from '@/types/seat';

interface SeatMapProps {
  rows: number;
  columns: number;
  sections: SeatSectionConfig[];
  bookedSeats: string[];
  lockedSeats?: string[];
  selectedSeats: Seat[];
  maxSeats: number;
  onSeatSelect: (seat: Seat) => void;
  onSeatDeselect: (seatId: string) => void;
  disabled?: boolean;
}

const seatColors = {
  available: 'bg-surface-active hover:bg-primary-500/50 cursor-pointer',
  booked: 'bg-gray-700 cursor-not-allowed opacity-50',
  locked: 'bg-yellow-500/50 cursor-not-allowed',
  selected: 'bg-primary-500 ring-2 ring-primary-400',
  unavailable: 'bg-transparent cursor-not-allowed',
};

const categoryColors = {
  standard: 'border-gray-500',
  premium: 'border-blue-500',
  vip: 'border-purple-500',
  recliner: 'border-amber-500',
};

export function SeatMap({
  rows,
  columns,
  sections,
  bookedSeats,
  lockedSeats = [],
  selectedSeats,
  maxSeats,
  onSeatSelect,
  onSeatDeselect,
  disabled = false,
}: SeatMapProps) {
  // Build seat grid with section info
  const seatGrid = useMemo(() => {
    const grid: (Seat | null)[][] = [];
    
    for (let row = 0; row < rows; row++) {
      const rowSeats: (Seat | null)[] = [];
      
      for (let col = 0; col < columns; col++) {
        const seatId = generateSeatLabel(row, col);
        
        // Find which section this seat belongs to
        const section = sections.find(
          (s) =>
            row >= s.rowStart &&
            row <= s.rowEnd &&
            col >= s.columnStart &&
            col <= s.columnEnd
        );
        
        if (!section) {
          rowSeats.push(null);
          continue;
        }
        
        // Check if seat is unavailable in layout
        const isUnavailable = section.unavailableSeats?.includes(seatId);
        
        if (isUnavailable) {
          rowSeats.push(null);
          continue;
        }
        
        const isBooked = bookedSeats.includes(seatId);
        const isLocked = lockedSeats.includes(seatId);
        const isSelected = selectedSeats.some((s) => s.id === seatId);
        
        let status: Seat['status'] = 'available';
        if (isBooked) status = 'booked';
        else if (isLocked) status = 'locked';
        else if (isSelected) status = 'selected';
        
        rowSeats.push({
          id: seatId,
          row,
          column: col,
          label: seatId,
          category: section.category,
          price: section.price,
          status,
        });
      }
      
      grid.push(rowSeats);
    }
    
    return grid;
  }, [rows, columns, sections, bookedSeats, lockedSeats, selectedSeats]);

  const handleSeatClick = useCallback(
    (seat: Seat) => {
      if (disabled) return;
      if (seat.status === 'booked' || seat.status === 'locked') return;
      
      if (seat.status === 'selected') {
        onSeatDeselect(seat.id);
      } else {
        if (selectedSeats.length >= maxSeats) return;
        onSeatSelect(seat);
      }
    },
    [disabled, selectedSeats.length, maxSeats, onSeatSelect, onSeatDeselect]
  );

  // Group sections for legend
  const uniqueSections = useMemo(() => {
    const seen = new Set<string>();
    return sections.filter((s) => {
      if (seen.has(s.category)) return false;
      seen.add(s.category);
      return true;
    });
  }, [sections]);

  return (
    <div className="space-y-6">
      {/* Screen */}
      <div className="relative">
        <div className="mx-auto w-3/4 h-2 bg-gradient-to-r from-transparent via-primary-500 to-transparent rounded-full" />
        <div className="mx-auto w-2/3 h-8 bg-gradient-to-b from-primary-500/20 to-transparent" />
        <p className="text-center text-xs text-gray-500 -mt-2">SCREEN</p>
      </div>

      {/* Seat Grid */}
      <div className="overflow-x-auto py-4">
        <div className="inline-block min-w-full">
          <div className="flex flex-col items-center gap-1.5">
            {seatGrid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-1.5">
                {/* Row Label */}
                <span className="w-6 text-xs text-gray-500 text-right">
                  {String.fromCharCode(65 + rowIndex)}
                </span>
                
                {/* Seats */}
                {row.map((seat, colIndex) => (
                  <motion.button
                    key={`${rowIndex}-${colIndex}`}
                    whileHover={seat?.status === 'available' && !disabled ? { scale: 1.15 } : {}}
                    whileTap={seat?.status === 'available' && !disabled ? { scale: 0.95 } : {}}
                    onClick={() => seat && handleSeatClick(seat)}
                    disabled={disabled || !seat || seat.status === 'booked' || seat.status === 'locked'}
                    className={cn(
                      'w-7 h-7 rounded-t-lg border-b-2 text-[10px] font-medium transition-colors flex items-center justify-center',
                      seat ? seatColors[seat.status] : 'bg-transparent cursor-default',
                      seat && categoryColors[seat.category],
                      disabled && 'cursor-not-allowed opacity-60'
                    )}
                    title={seat ? `${seat.label} - ₹${seat.price}` : undefined}
                  >
                    {seat?.status === 'selected' && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-white"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                ))}
                
                {/* Row Label (right side) */}
                <span className="w-6 text-xs text-gray-500 text-left">
                  {String.fromCharCode(65 + rowIndex)}
                </span>
              </div>
            ))}
          </div>

          {/* Column Numbers */}
          <div className="flex items-center gap-1.5 mt-2 justify-center">
            <span className="w-6" />
            {Array.from({ length: columns }).map((_, i) => (
              <span key={i} className="w-7 text-center text-xs text-gray-500">
                {i + 1}
              </span>
            ))}
            <span className="w-6" />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t-md bg-surface-active border-b-2 border-gray-500" />
          <span className="text-gray-400">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t-md bg-primary-500 border-b-2 border-primary-400" />
          <span className="text-gray-400">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t-md bg-gray-700 border-b-2 border-gray-600 opacity-50" />
          <span className="text-gray-400">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t-md bg-yellow-500/50 border-b-2 border-yellow-500" />
          <span className="text-gray-400">Locked</span>
        </div>
      </div>

      {/* Section Pricing */}
      <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-surface rounded-lg border border-border">
        {uniqueSections.map((section) => (
          <div key={section.category} className="flex items-center gap-2">
            <div
              className={cn(
                'w-4 h-4 rounded-t-md border-b-2',
                categoryColors[section.category],
                'bg-surface-active'
              )}
            />
            <span className="text-gray-300 capitalize">{section.category}</span>
            <span className="text-primary-400 font-medium">₹{section.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
