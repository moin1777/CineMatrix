'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  VenueTemplateData,
  RuntimeSeat,
  SeatSelectionState,
  SparseSeat,
  SparseSection,
} from '@/types/seat';

interface UseSeatMapOptions {
  template: VenueTemplateData;
  bookedSeats: string[];
  lockedSeats?: string[];
  maxSeats?: number;
  initialSelectedSeats?: string[];
  onSelectionChange?: (selection: SeatSelectionState) => void;
}

interface UseSeatMapReturn {
  // State
  selectedSeats: RuntimeSeat[];
  bookedSeatsSet: Set<string>;
  lockedSeatsSet: Set<string>;
  selectionState: SeatSelectionState;
  
  // Actions
  selectSeat: (seat: RuntimeSeat) => void;
  deselectSeat: (seatId: string) => void;
  clearSelection: () => void;
  selectMultiple: (seats: RuntimeSeat[]) => void;
  
  // Computed
  canSelectMore: boolean;
  totalPrice: number;
  selectedSeatIds: Set<string>;
}

/**
 * Calculate seat price based on section
 */
function calculateSeatPrice(seat: SparseSeat, sections: SparseSection[]): number {
  const section = sections.find(s => s.category === seat.category);
  return section ? section.basePrice * seat.priceMultiplier : 0;
}

/**
 * Convert SparseSeat to RuntimeSeat
 */
function toRuntimeSeat(
  seat: SparseSeat,
  sections: SparseSection[],
  runtimeStatus: RuntimeSeat['runtimeStatus']
): RuntimeSeat {
  const section = sections.find(s => s.category === seat.category);
  return {
    ...seat,
    runtimeStatus,
    price: calculateSeatPrice(seat, sections),
    section,
  };
}

/**
 * Custom hook for managing seat map state and selection
 */
export function useSeatMap({
  template,
  bookedSeats,
  lockedSeats = [],
  maxSeats = 10,
  initialSelectedSeats = [],
  onSelectionChange,
}: UseSeatMapOptions): UseSeatMapReturn {
  // Convert arrays to sets for efficient lookup
  const bookedSeatsSet = useMemo(() => new Set(bookedSeats), [bookedSeats]);
  const lockedSeatsSet = useMemo(() => new Set(lockedSeats), [lockedSeats]);
  
  // Initialize selected seats
  const initialRuntimeSeats = useMemo(() => {
    const initialSet = new Set(initialSelectedSeats);
    return template.seats
      .filter(seat => initialSet.has(seat.seatId))
      .map(seat => toRuntimeSeat(seat, template.sections, 'selected'));
  }, [template, initialSelectedSeats]);
  
  // Selected seats state
  const [selectedSeats, setSelectedSeats] = useState<RuntimeSeat[]>(initialRuntimeSeats);
  
  // Selected seat IDs for quick lookup
  const selectedSeatIds = useMemo(
    () => new Set(selectedSeats.map(s => s.seatId)),
    [selectedSeats]
  );
  
  // Calculate total price
  const totalPrice = useMemo(
    () => selectedSeats.reduce((sum, seat) => sum + seat.price, 0),
    [selectedSeats]
  );
  
  // Can select more seats?
  const canSelectMore = selectedSeats.length < maxSeats;
  
  // Selection state object
  const selectionState = useMemo<SeatSelectionState>(
    () => ({
      selectedSeats,
      totalPrice,
      maxSeats,
      canSelectMore,
    }),
    [selectedSeats, totalPrice, maxSeats, canSelectMore]
  );
  
  // Select a seat
  const selectSeat = useCallback((seat: RuntimeSeat) => {
    if (selectedSeats.length >= maxSeats) {
      return;
    }
    
    // Don't select if already selected, booked, or locked
    if (
      selectedSeatIds.has(seat.seatId) ||
      bookedSeatsSet.has(seat.seatId) ||
      lockedSeatsSet.has(seat.seatId) ||
      seat.status !== 'active'
    ) {
      return;
    }
    
    const runtimeSeat = toRuntimeSeat(
      seat,
      template.sections,
      'selected'
    );
    
    setSelectedSeats(prev => [...prev, runtimeSeat]);
  }, [selectedSeats.length, maxSeats, selectedSeatIds, bookedSeatsSet, lockedSeatsSet, template.sections]);
  
  // Deselect a seat
  const deselectSeat = useCallback((seatId: string) => {
    setSelectedSeats(prev => prev.filter(seat => seat.seatId !== seatId));
  }, []);
  
  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedSeats([]);
  }, []);
  
  // Select multiple seats at once
  const selectMultiple = useCallback((seats: RuntimeSeat[]) => {
    const availableSlots = maxSeats - selectedSeats.length;
    if (availableSlots <= 0) return;
    
    const validSeats = seats
      .filter(seat => 
        !selectedSeatIds.has(seat.seatId) &&
        !bookedSeatsSet.has(seat.seatId) &&
        !lockedSeatsSet.has(seat.seatId) &&
        seat.status === 'active'
      )
      .slice(0, availableSlots)
      .map(seat => toRuntimeSeat(seat, template.sections, 'selected'));
    
    if (validSeats.length > 0) {
      setSelectedSeats(prev => [...prev, ...validSeats]);
    }
  }, [maxSeats, selectedSeats.length, selectedSeatIds, bookedSeatsSet, lockedSeatsSet, template.sections]);
  
  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectionState);
    }
  }, [selectionState, onSelectionChange]);
  
  return {
    selectedSeats,
    bookedSeatsSet,
    lockedSeatsSet,
    selectionState,
    selectSeat,
    deselectSeat,
    clearSelection,
    selectMultiple,
    canSelectMore,
    totalPrice,
    selectedSeatIds,
  };
}

/**
 * Hook for managing seat map viewport (zoom/pan)
 */
export interface UseViewportOptions {
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
}

export interface UseViewportReturn {
  scale: number;
  position: { x: number; y: number };
  isDragging: boolean;
  setScale: (scale: number) => void;
  setPosition: (position: { x: number; y: number }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  setIsDragging: (isDragging: boolean) => void;
}

export function useViewport({
  initialScale = 1,
  minScale = 0.3,
  maxScale = 3,
}: UseViewportOptions = {}): UseViewportReturn {
  const [scale, setScaleState] = useState(initialScale);
  const [position, setPositionState] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const setScale = useCallback((newScale: number) => {
    setScaleState(Math.max(minScale, Math.min(maxScale, newScale)));
  }, [minScale, maxScale]);
  
  const setPosition = useCallback((newPosition: { x: number; y: number }) => {
    setPositionState(newPosition);
  }, []);
  
  const zoomIn = useCallback(() => {
    setScale(scale * 1.2);
  }, [scale, setScale]);
  
  const zoomOut = useCallback(() => {
    setScale(scale / 1.2);
  }, [scale, setScale]);
  
  const reset = useCallback(() => {
    setScaleState(initialScale);
    setPositionState({ x: 0, y: 0 });
  }, [initialScale]);
  
  return {
    scale,
    position,
    isDragging,
    setScale,
    setPosition,
    zoomIn,
    zoomOut,
    reset,
    setIsDragging,
  };
}

export default useSeatMap;
