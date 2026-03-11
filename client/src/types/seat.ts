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

// ============================================================================
// SPARSE MATRIX SEAT MAP TYPES (for Interactive Canvas-based Rendering)
// ============================================================================

/**
 * Seat category defines the type and pricing tier of a seat
 */
export type SparseSeatCategory = 
  | 'standard' 
  | 'premium' 
  | 'vip' 
  | 'recliner' 
  | 'wheelchair' 
  | 'companion' 
  | 'loveseat'
  | 'balcony';

/**
 * Seat status in the sparse matrix layout
 */
export type SparseSeatStatus = 
  | 'active'      // Seat is available for booking
  | 'inactive'    // Seat is temporarily disabled
  | 'maintenance' // Seat is under maintenance
  | 'removed';    // Seat has been removed from layout

/**
 * Runtime seat status for booking flow
 */
export type RuntimeSeatStatus = 
  | 'available'  // Can be selected
  | 'booked'     // Already booked by someone
  | 'locked'     // Temporarily locked by another user
  | 'selected'   // Selected by current user
  | 'disabled';  // Disabled in layout

/**
 * Seat attributes for special features
 */
export interface SparseSeatAttributes {
  hasArmrest?: boolean;
  hasLegroom?: boolean;
  isAisle?: boolean;
  isCenter?: boolean;
  hasObstructedView?: boolean;
  notes?: string;
}

/**
 * Seat dimensions override
 */
export interface SparseSeatDimensions {
  width: number;
  height: number;
}

/**
 * Individual seat in the sparse matrix layout
 */
export interface SparseSeat {
  /** Unique identifier for this seat */
  seatId: string;
  /** Row index in the sparse matrix (0-indexed) */
  rowIndex: number;
  /** Column index in the sparse matrix (0-indexed) */
  colIndex: number;
  /** Human-readable label (e.g., "A1", "VIP-5") */
  seatLabel: string;
  /** Row label (e.g., "A", "B", "VIP") */
  rowLabel: string;
  /** Seat category for pricing and display */
  category: SparseSeatCategory;
  /** Base price multiplier for this seat */
  priceMultiplier: number;
  /** Layout status */
  status: SparseSeatStatus;
  /** Rotation angle in degrees */
  rotation?: number;
  /** Special attributes */
  attributes?: SparseSeatAttributes;
  /** Seat dimensions override */
  dimensions?: SparseSeatDimensions;
}

/**
 * Section definition for grouping seats
 */
export interface SparseSection {
  /** Section identifier */
  sectionId: string;
  /** Section display name */
  name: string;
  /** Section category for styling */
  category: SparseSeatCategory;
  /** Base price for this section */
  basePrice: number;
  /** Color code for rendering (hex) */
  color: string;
  /** Section boundaries */
  bounds?: {
    rowStart: number;
    rowEnd: number;
    colStart: number;
    colEnd: number;
  };
  /** Sort order for display */
  displayOrder: number;
}

/**
 * Aisle definition
 */
export interface SparseAisle {
  /** Unique identifier */
  aisleId: string;
  /** Type of aisle */
  type: 'horizontal' | 'vertical' | 'diagonal';
  /** Position */
  position: number;
  /** Width of the aisle */
  width: number;
  /** Start position */
  startPos?: number;
  /** End position */
  endPos?: number;
  /** Label */
  label?: string;
}

/**
 * Layout configuration
 */
export interface SparseLayoutConfig {
  /** Maximum rows */
  maxRows: number;
  /** Maximum columns */
  maxColumns: number;
  /** Default seat dimensions */
  defaultSeatSize: {
    width: number;
    height: number;
  };
  /** Gap between seats */
  seatGap: {
    horizontal: number;
    vertical: number;
  };
  /** Padding around the layout */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Screen/stage position */
  stagePosition: 'top' | 'bottom' | 'left' | 'right';
  /** Layout shape */
  shape: 'rectangular' | 'curved' | 'horseshoe' | 'circular' | 'custom';
  /** Curve radius for curved layouts */
  curveRadius?: number;
  /** Background color */
  backgroundColor?: string;
  /** Grid visibility */
  showGrid?: boolean;
  /** Row labels position */
  rowLabelsPosition: 'left' | 'right' | 'both';
}

/**
 * Stage/Screen configuration
 */
export interface SparseStage {
  /** Stage label */
  label: string;
  /** Stage width (percentage) */
  widthPercent: number;
  /** Stage height (pixels) */
  height: number;
  /** Stage color */
  color: string;
  /** Glow effect */
  glowEffect?: boolean;
}

/**
 * Complete venue template data
 */
export interface VenueTemplateData {
  _id: string;
  name: string;
  description?: string;
  venueId: string;
  screenId?: string;
  screenName?: string;
  screenType: 'standard' | 'imax' | 'dolby' | '4dx' | 'screenx' | 'premium' | 'outdoor';
  totalCapacity: number;
  layout: SparseLayoutConfig;
  stage: SparseStage;
  seats: SparseSeat[];
  sections: SparseSection[];
  aisles: SparseAisle[];
  version: number;
  isActive: boolean;
  isDraft: boolean;
}

/**
 * Runtime seat with booking status
 */
export interface RuntimeSeat extends SparseSeat {
  /** Runtime status for booking */
  runtimeStatus: RuntimeSeatStatus;
  /** Calculated price */
  price: number;
  /** Section this seat belongs to */
  section?: SparseSection;
}

/**
 * Seat map interaction handlers
 */
export interface SeatMapInteraction {
  onSeatClick: (seat: RuntimeSeat) => void;
  onSeatHover: (seat: RuntimeSeat | null) => void;
  onZoomChange: (scale: number) => void;
  onPanChange: (x: number, y: number) => void;
}

/**
 * Selection state for the seat map
 */
export interface SeatSelectionState {
  selectedSeats: RuntimeSeat[];
  totalPrice: number;
  maxSeats: number;
  canSelectMore: boolean;
}

/**
 * Zoom and pan state
 */
export interface ViewportState {
  scale: number;
  minScale: number;
  maxScale: number;
  position: { x: number; y: number };
  isDragging: boolean;
}

