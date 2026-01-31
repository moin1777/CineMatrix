// Seat selection related types
export interface Seat {
  id: string;
  row: number;
  column: number;
  label: string;
  category: 'standard' | 'premium' | 'vip' | 'recliner';
  price: number;
  status: 'available' | 'booked' | 'locked' | 'selected' | 'unavailable';
}

export interface SeatRow {
  rowIndex: number;
  rowLabel: string;
  seats: Seat[];
}

export interface SeatMapConfig {
  rows: number;
  columns: number;
  sections: SeatSectionConfig[];
  gap?: {
    row: number;
    column: number;
  };
}

export interface SeatSectionConfig {
  name: string;
  category: 'standard' | 'premium' | 'vip' | 'recliner';
  price: number;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
  unavailableSeats?: string[];
}

export interface SeatSelection {
  seats: Seat[];
  totalPrice: number;
  expiresAt: string | null;
}

export interface LockTimer {
  remainingSeconds: number;
  expiresAt: Date;
  isExpired: boolean;
}
