import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================================================
// SEAT TYPES & INTERFACES
// ============================================================================

/**
 * Seat category defines the type and pricing tier of a seat
 */
export type SeatCategory = 
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
export type SeatStatus = 
  | 'active'      // Seat is available for booking
  | 'inactive'    // Seat is temporarily disabled
  | 'maintenance' // Seat is under maintenance
  | 'removed';    // Seat has been removed from layout

/**
 * Individual seat in the sparse matrix layout
 * Each seat has logical coordinates (rowIndex, colIndex) and metadata
 */
export interface ISeat {
  /** Unique identifier for this seat within the template */
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
  category: SeatCategory;
  /** Base price multiplier for this seat (1.0 = base price) */
  priceMultiplier: number;
  /** Seat status */
  status: SeatStatus;
  /** Rotation angle in degrees (for angled seating) */
  rotation?: number;
  /** Special attributes */
  attributes?: {
    hasArmrest?: boolean;
    hasLegroom?: boolean;
    isAisle?: boolean;
    isCenter?: boolean;
    hasObstructedView?: boolean;
    notes?: string;
  };
  /** Seat dimensions override (if different from default) */
  dimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Section definition for grouping seats with common pricing
 */
export interface ISection {
  /** Section identifier */
  sectionId: string;
  /** Section display name */
  name: string;
  /** Section category for styling */
  category: SeatCategory;
  /** Base price for this section */
  basePrice: number;
  /** Color code for rendering (hex) */
  color: string;
  /** Section boundaries (for visual grouping) */
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
 * Aisle/walkway definition for the sparse matrix
 */
export interface IAisle {
  /** Unique identifier */
  aisleId: string;
  /** Type of aisle */
  type: 'horizontal' | 'vertical' | 'diagonal';
  /** Position (row or column index depending on type) */
  position: number;
  /** Width of the aisle (in grid units) */
  width: number;
  /** Start position (for partial aisles) */
  startPos?: number;
  /** End position (for partial aisles) */
  endPos?: number;
  /** Label (e.g., "Main Aisle", "Emergency Exit") */
  label?: string;
}

/**
 * Layout metadata for rendering
 */
export interface ILayoutConfig {
  /** Maximum rows in the layout */
  maxRows: number;
  /** Maximum columns in the layout */
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
 * Screen/Stage definition
 */
export interface IStage {
  /** Stage label */
  label: string;
  /** Stage width (percentage of layout width) */
  widthPercent: number;
  /** Stage height (in pixels) */
  height: number;
  /** Stage color */
  color: string;
  /** Glow effect */
  glowEffect?: boolean;
}

/**
 * Venue Template - Main document interface
 * Represents a reusable layout template for a venue screen/hall
 */
export interface IVenueTemplate extends Document {
  /** Template name */
  name: string;
  /** Description */
  description?: string;
  /** Associated venue ID */
  venueId: Types.ObjectId;
  /** Screen/Hall identifier within the venue */
  screenId?: string;
  /** Screen/Hall name */
  screenName?: string;
  /** Screen type */
  screenType: 'standard' | 'imax' | 'dolby' | '4dx' | 'screenx' | 'premium' | 'outdoor';
  /** Total capacity (calculated from active seats) */
  totalCapacity: number;
  /** Layout configuration */
  layout: ILayoutConfig;
  /** Stage/Screen configuration */
  stage: IStage;
  /** Sparse matrix of seats */
  seats: ISeat[];
  /** Section definitions */
  sections: ISection[];
  /** Aisle definitions */
  aisles: IAisle[];
  /** Version number for template versioning */
  version: number;
  /** Is this the active version */
  isActive: boolean;
  /** Is this a draft template */
  isDraft: boolean;
  /** Created by user ID */
  createdBy: Types.ObjectId;
  /** Last modified by user ID */
  lastModifiedBy?: Types.ObjectId;
  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// MONGOOSE SCHEMAS
// ============================================================================

const SeatAttributesSchema = new Schema({
  hasArmrest: { type: Boolean },
  hasLegroom: { type: Boolean },
  isAisle: { type: Boolean },
  isCenter: { type: Boolean },
  hasObstructedView: { type: Boolean },
  notes: { type: String, maxlength: 200 }
}, { _id: false });

const SeatDimensionsSchema = new Schema({
  width: { type: Number, required: true, min: 10, max: 200 },
  height: { type: Number, required: true, min: 10, max: 200 }
}, { _id: false });

const SeatSchema = new Schema<ISeat>({
  seatId: { 
    type: String, 
    required: true,
    match: /^[A-Z0-9\-_]+$/i
  },
  rowIndex: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  colIndex: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 200 
  },
  seatLabel: { 
    type: String, 
    required: true,
    maxlength: 20
  },
  rowLabel: { 
    type: String, 
    required: true,
    maxlength: 10
  },
  category: { 
    type: String, 
    enum: ['standard', 'premium', 'vip', 'recliner', 'wheelchair', 'companion', 'loveseat', 'balcony'],
    default: 'standard'
  },
  priceMultiplier: { 
    type: Number, 
    default: 1.0,
    min: 0.1,
    max: 10.0
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'maintenance', 'removed'],
    default: 'active'
  },
  rotation: { 
    type: Number, 
    default: 0,
    min: -180,
    max: 180
  },
  attributes: SeatAttributesSchema,
  dimensions: SeatDimensionsSchema
}, { _id: false });

const SectionBoundsSchema = new Schema({
  rowStart: { type: Number, required: true, min: 0 },
  rowEnd: { type: Number, required: true, min: 0 },
  colStart: { type: Number, required: true, min: 0 },
  colEnd: { type: Number, required: true, min: 0 }
}, { _id: false });

const SectionSchema = new Schema<ISection>({
  sectionId: { 
    type: String, 
    required: true,
    match: /^[A-Z0-9\-_]+$/i
  },
  name: { 
    type: String, 
    required: true,
    maxlength: 50
  },
  category: { 
    type: String, 
    enum: ['standard', 'premium', 'vip', 'recliner', 'wheelchair', 'companion', 'loveseat', 'balcony'],
    required: true
  },
  basePrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  color: { 
    type: String, 
    required: true,
    match: /^#[0-9A-Fa-f]{6}$/
  },
  bounds: SectionBoundsSchema,
  displayOrder: { 
    type: Number, 
    default: 0 
  }
}, { _id: false });

const AisleSchema = new Schema<IAisle>({
  aisleId: { 
    type: String, 
    required: true,
    match: /^[A-Z0-9\-_]+$/i
  },
  type: { 
    type: String, 
    enum: ['horizontal', 'vertical', 'diagonal'],
    required: true
  },
  position: { 
    type: Number, 
    required: true,
    min: 0
  },
  width: { 
    type: Number, 
    required: true,
    min: 1,
    max: 10
  },
  startPos: { type: Number, min: 0 },
  endPos: { type: Number, min: 0 },
  label: { type: String, maxlength: 50 }
}, { _id: false });

const LayoutConfigSchema = new Schema<ILayoutConfig>({
  maxRows: { 
    type: Number, 
    required: true,
    min: 1,
    max: 100
  },
  maxColumns: { 
    type: Number, 
    required: true,
    min: 1,
    max: 200
  },
  defaultSeatSize: {
    width: { type: Number, required: true, default: 30, min: 10, max: 100 },
    height: { type: Number, required: true, default: 30, min: 10, max: 100 }
  },
  seatGap: {
    horizontal: { type: Number, required: true, default: 4, min: 0, max: 50 },
    vertical: { type: Number, required: true, default: 8, min: 0, max: 50 }
  },
  padding: {
    top: { type: Number, default: 60, min: 0, max: 200 },
    right: { type: Number, default: 40, min: 0, max: 200 },
    bottom: { type: Number, default: 40, min: 0, max: 200 },
    left: { type: Number, default: 60, min: 0, max: 200 }
  },
  stagePosition: { 
    type: String, 
    enum: ['top', 'bottom', 'left', 'right'],
    default: 'top'
  },
  shape: { 
    type: String, 
    enum: ['rectangular', 'curved', 'horseshoe', 'circular', 'custom'],
    default: 'rectangular'
  },
  curveRadius: { type: Number, min: 100, max: 5000 },
  backgroundColor: { 
    type: String, 
    default: '#1a1a2e',
    match: /^#[0-9A-Fa-f]{6}$/
  },
  showGrid: { type: Boolean, default: false },
  rowLabelsPosition: { 
    type: String, 
    enum: ['left', 'right', 'both'],
    default: 'left'
  }
}, { _id: false });

const StageSchema = new Schema<IStage>({
  label: { 
    type: String, 
    required: true,
    default: 'SCREEN',
    maxlength: 30
  },
  widthPercent: { 
    type: Number, 
    required: true,
    default: 80,
    min: 20,
    max: 100
  },
  height: { 
    type: Number, 
    required: true,
    default: 20,
    min: 10,
    max: 100
  },
  color: { 
    type: String, 
    default: '#6366f1',
    match: /^#[0-9A-Fa-f]{6}$/
  },
  glowEffect: { 
    type: Boolean, 
    default: true 
  }
}, { _id: false });

// ============================================================================
// MAIN VENUE TEMPLATE SCHEMA
// ============================================================================

const VenueTemplateSchema = new Schema<IVenueTemplate>({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  description: { 
    type: String, 
    maxlength: 500 
  },
  venueId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Venue', 
    required: true,
    index: true
  },
  screenId: { 
    type: String,
    index: true
  },
  screenName: { 
    type: String,
    maxlength: 50
  },
  screenType: { 
    type: String, 
    enum: ['standard', 'imax', 'dolby', '4dx', 'screenx', 'premium', 'outdoor'],
    default: 'standard',
    index: true
  },
  totalCapacity: { 
    type: Number, 
    required: true,
    min: 1,
    max: 10000
  },
  layout: { 
    type: LayoutConfigSchema, 
    required: true 
  },
  stage: { 
    type: StageSchema, 
    required: true 
  },
  seats: { 
    type: [SeatSchema], 
    required: true,
    validate: {
      validator: function(seats: ISeat[]) {
        return seats.length > 0;
      },
      message: 'At least one seat is required'
    }
  },
  sections: { 
    type: [SectionSchema], 
    required: true,
    validate: {
      validator: function(sections: ISection[]) {
        return sections.length > 0;
      },
      message: 'At least one section is required'
    }
  },
  aisles: { 
    type: [AisleSchema], 
    default: [] 
  },
  version: { 
    type: Number, 
    default: 1,
    min: 1
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  isDraft: { 
    type: Boolean, 
    default: true,
    index: true
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  lastModifiedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { 
  timestamps: true,
  collection: 'venue_templates'
});

// ============================================================================
// INDEXES
// ============================================================================

// Compound index for finding templates by venue and screen
VenueTemplateSchema.index({ venueId: 1, screenId: 1, isActive: 1 });

// Compound index for version management
VenueTemplateSchema.index({ venueId: 1, screenId: 1, version: -1 });

// Index for draft templates
VenueTemplateSchema.index({ createdBy: 1, isDraft: 1 });

// ============================================================================
// PRE-SAVE HOOKS
// ============================================================================

VenueTemplateSchema.pre('save', async function() {
  // Calculate total capacity from active seats
  this.totalCapacity = this.seats.filter(seat => seat.status === 'active').length;
  
  // Validate seat coordinates don't exceed layout bounds
  const maxRow = Math.max(...this.seats.map(s => s.rowIndex));
  const maxCol = Math.max(...this.seats.map(s => s.colIndex));
  
  if (maxRow >= this.layout.maxRows) {
    throw new Error(`Seat row index ${maxRow} exceeds layout maxRows ${this.layout.maxRows}`);
  }
  if (maxCol >= this.layout.maxColumns) {
    throw new Error(`Seat column index ${maxCol} exceeds layout maxColumns ${this.layout.maxColumns}`);
  }
  
  // Validate unique seat IDs
  const seatIds = this.seats.map(s => s.seatId);
  const uniqueSeatIds = new Set(seatIds);
  if (seatIds.length !== uniqueSeatIds.size) {
    throw new Error('Duplicate seat IDs found in template');
  }
  
  // Validate unique section IDs
  const sectionIds = this.sections.map(s => s.sectionId);
  const uniqueSectionIds = new Set(sectionIds);
  if (sectionIds.length !== uniqueSectionIds.size) {
    throw new Error('Duplicate section IDs found in template');
  }
});

// ============================================================================
// METHODS
// ============================================================================

VenueTemplateSchema.methods.toSparseMatrix = function(): Map<string, ISeat> {
  const matrix = new Map<string, ISeat>();
  for (const seat of this.seats) {
    const key = `${seat.rowIndex},${seat.colIndex}`;
    matrix.set(key, seat);
  }
  return matrix;
};

VenueTemplateSchema.methods.getSeatsByCategory = function(category: SeatCategory): ISeat[] {
  return this.seats.filter((seat: ISeat) => seat.category === category && seat.status === 'active');
};

VenueTemplateSchema.methods.getSeatsBySection = function(sectionId: string): ISeat[] {
  const section = this.sections.find((s: ISection) => s.sectionId === sectionId);
  if (!section || !section.bounds) return [];
  
  return this.seats.filter((seat: ISeat) => 
    seat.rowIndex >= section.bounds!.rowStart &&
    seat.rowIndex <= section.bounds!.rowEnd &&
    seat.colIndex >= section.bounds!.colStart &&
    seat.colIndex <= section.bounds!.colEnd &&
    seat.status === 'active'
  );
};

VenueTemplateSchema.methods.getCapacityBySection = function(): Record<string, number> {
  const capacities: Record<string, number> = {};
  for (const section of this.sections) {
    const seats = this.getSeatsBySection(section.sectionId);
    capacities[section.sectionId] = seats.length;
  }
  return capacities;
};

// ============================================================================
// STATICS
// ============================================================================

VenueTemplateSchema.statics.getActiveTemplate = async function(venueId: string, screenId: string) {
  return this.findOne({
    venueId,
    screenId,
    isActive: true,
    isDraft: false
  }).sort({ version: -1 });
};

VenueTemplateSchema.statics.getAllVersions = async function(venueId: string, screenId: string) {
  return this.find({
    venueId,
    screenId
  }).sort({ version: -1 });
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a standard rectangular seat layout
 */
export function generateStandardLayout(
  rows: number,
  seatsPerRow: number,
  basePrice: number,
  options?: {
    aisleAfterColumn?: number[];
    aisleAfterRow?: number[];
    vipRows?: number[];
    premiumRows?: number[];
  }
): { seats: ISeat[]; sections: ISection[]; aisles: IAisle[] } {
  const seats: ISeat[] = [];
  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  const vipRows = new Set(options?.vipRows || []);
  const premiumRows = new Set(options?.premiumRows || [rows - 1, rows - 2]);
  const aisleColumns = new Set(options?.aisleAfterColumn || [Math.floor(seatsPerRow / 3), Math.floor(2 * seatsPerRow / 3)]);
  
  let colOffset = 0;
  
  for (let r = 0; r < rows; r++) {
    const rowLabel = r < 26 ? rowLabels[r] : `R${r + 1}`;
    colOffset = 0;
    
    for (let c = 0; c < seatsPerRow; c++) {
      // Add aisle offset
      if (aisleColumns.has(c)) {
        colOffset++;
      }
      
      let category: SeatCategory = 'standard';
      let priceMultiplier = 1.0;
      
      if (vipRows.has(r)) {
        category = 'vip';
        priceMultiplier = 2.0;
      } else if (premiumRows.has(r)) {
        category = 'premium';
        priceMultiplier = 1.5;
      }
      
      // First seat of first row is wheelchair accessible
      if (r === 0 && c === 0) {
        category = 'wheelchair';
        priceMultiplier = 1.0;
      }
      
      const actualCol = c + colOffset;
      const seatNumber = c + 1;
      
      seats.push({
        seatId: `${rowLabel}${seatNumber}`,
        rowIndex: r,
        colIndex: actualCol,
        seatLabel: `${rowLabel}${seatNumber}`,
        rowLabel,
        category,
        priceMultiplier,
        status: 'active',
        rotation: 0,
        attributes: {
          isAisle: c === 0 || c === seatsPerRow - 1 || aisleColumns.has(c) || aisleColumns.has(c + 1),
          isCenter: c >= Math.floor(seatsPerRow / 3) && c <= Math.floor(2 * seatsPerRow / 3)
        }
      });
    }
  }
  
  // Generate sections
  const sections: ISection[] = [
    {
      sectionId: 'standard',
      name: 'Standard',
      category: 'standard',
      basePrice,
      color: '#22c55e',
      displayOrder: 1
    },
    {
      sectionId: 'premium',
      name: 'Premium',
      category: 'premium',
      basePrice: basePrice * 1.5,
      color: '#3b82f6',
      displayOrder: 2
    },
    {
      sectionId: 'vip',
      name: 'VIP',
      category: 'vip',
      basePrice: basePrice * 2,
      color: '#a855f7',
      displayOrder: 3
    }
  ];
  
  // Generate aisles
  const aisles: IAisle[] = Array.from(aisleColumns).map((col, index) => ({
    aisleId: `aisle-v-${index + 1}`,
    type: 'vertical' as const,
    position: col,
    width: 1,
    label: `Aisle ${index + 1}`
  }));
  
  return { seats, sections, aisles };
}

/**
 * Generate a curved/stadium seat layout
 */
export function generateCurvedLayout(
  rows: number,
  seatsPerRow: number,
  basePrice: number,
  curveRadius: number = 500
): { seats: ISeat[]; sections: ISection[]; aisles: IAisle[] } {
  const seats: ISeat[] = [];
  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  for (let r = 0; r < rows; r++) {
    const rowLabel = r < 26 ? rowLabels[r] : `R${r + 1}`;
    const rowRadius = curveRadius + (r * 40);
    const angleSpan = Math.PI * 0.6; // 108 degrees
    const startAngle = (Math.PI - angleSpan) / 2;
    
    // Fewer seats in front rows for curved layout
    const rowSeats = Math.min(seatsPerRow, Math.floor(seatsPerRow * (0.6 + (r / rows) * 0.4)));
    
    for (let c = 0; c < rowSeats; c++) {
      const angle = startAngle + (c / (rowSeats - 1)) * angleSpan;
      const colIndex = Math.round(c * (seatsPerRow / rowSeats));
      
      let category: SeatCategory = 'standard';
      let priceMultiplier = 1.0;
      
      if (r >= rows - 2) {
        category = 'vip';
        priceMultiplier = 2.0;
      } else if (r >= rows - 4) {
        category = 'premium';
        priceMultiplier = 1.5;
      }
      
      const seatNumber = c + 1;
      const rotation = ((angle - Math.PI / 2) * 180) / Math.PI;
      
      seats.push({
        seatId: `${rowLabel}${seatNumber}`,
        rowIndex: r,
        colIndex,
        seatLabel: `${rowLabel}${seatNumber}`,
        rowLabel,
        category,
        priceMultiplier,
        status: 'active',
        rotation: Math.round(rotation),
        attributes: {
          isCenter: c >= rowSeats / 3 && c <= (2 * rowSeats) / 3
        }
      });
    }
  }
  
  const sections: ISection[] = [
    {
      sectionId: 'standard',
      name: 'Standard',
      category: 'standard',
      basePrice,
      color: '#22c55e',
      displayOrder: 1
    },
    {
      sectionId: 'premium',
      name: 'Premium',
      category: 'premium',
      basePrice: basePrice * 1.5,
      color: '#3b82f6',
      displayOrder: 2
    },
    {
      sectionId: 'vip',
      name: 'VIP',
      category: 'vip',
      basePrice: basePrice * 2,
      color: '#a855f7',
      displayOrder: 3
    }
  ];
  
  return { seats, sections, aisles: [] };
}

// Export model
export const VenueTemplate = mongoose.model<IVenueTemplate>('VenueTemplate', VenueTemplateSchema);
