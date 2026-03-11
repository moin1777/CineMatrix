import { z } from 'zod';

// ============================================================================
// SEAT VALIDATION SCHEMAS
// ============================================================================

const seatAttributesSchema = z.object({
  hasArmrest: z.boolean().optional(),
  hasLegroom: z.boolean().optional(),
  isAisle: z.boolean().optional(),
  isCenter: z.boolean().optional(),
  hasObstructedView: z.boolean().optional(),
  notes: z.string().max(200).optional()
}).optional();

const seatDimensionsSchema = z.object({
  width: z.number().min(10).max(200),
  height: z.number().min(10).max(200)
}).optional();

const seatSchema = z.object({
  seatId: z.string().regex(/^[A-Z0-9\-_]+$/i, 'Invalid seat ID format'),
  rowIndex: z.number().int().min(0).max(100),
  colIndex: z.number().int().min(0).max(200),
  seatLabel: z.string().max(20),
  rowLabel: z.string().max(10),
  category: z.enum(['standard', 'premium', 'vip', 'recliner', 'wheelchair', 'companion', 'loveseat', 'balcony']),
  priceMultiplier: z.number().min(0.1).max(10).default(1.0),
  status: z.enum(['active', 'inactive', 'maintenance', 'removed']).default('active'),
  rotation: z.number().min(-180).max(180).default(0).optional(),
  attributes: seatAttributesSchema,
  dimensions: seatDimensionsSchema
});

// ============================================================================
// SECTION VALIDATION SCHEMAS
// ============================================================================

const sectionBoundsSchema = z.object({
  rowStart: z.number().int().min(0),
  rowEnd: z.number().int().min(0),
  colStart: z.number().int().min(0),
  colEnd: z.number().int().min(0)
}).optional();

const sectionSchema = z.object({
  sectionId: z.string().regex(/^[A-Z0-9\-_]+$/i, 'Invalid section ID format'),
  name: z.string().max(50),
  category: z.enum(['standard', 'premium', 'vip', 'recliner', 'wheelchair', 'companion', 'loveseat', 'balcony']),
  basePrice: z.number().min(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format'),
  bounds: sectionBoundsSchema,
  displayOrder: z.number().int().default(0)
});

// ============================================================================
// AISLE VALIDATION SCHEMAS
// ============================================================================

const aisleSchema = z.object({
  aisleId: z.string().regex(/^[A-Z0-9\-_]+$/i, 'Invalid aisle ID format'),
  type: z.enum(['horizontal', 'vertical', 'diagonal']),
  position: z.number().int().min(0),
  width: z.number().int().min(1).max(10),
  startPos: z.number().int().min(0).optional(),
  endPos: z.number().int().min(0).optional(),
  label: z.string().max(50).optional()
});

// ============================================================================
// LAYOUT CONFIG VALIDATION SCHEMAS
// ============================================================================

const layoutConfigSchema = z.object({
  maxRows: z.number().int().min(1).max(100),
  maxColumns: z.number().int().min(1).max(200),
  defaultSeatSize: z.object({
    width: z.number().min(10).max(100).default(30),
    height: z.number().min(10).max(100).default(30)
  }),
  seatGap: z.object({
    horizontal: z.number().min(0).max(50).default(4),
    vertical: z.number().min(0).max(50).default(8)
  }),
  padding: z.object({
    top: z.number().min(0).max(200).default(60),
    right: z.number().min(0).max(200).default(40),
    bottom: z.number().min(0).max(200).default(40),
    left: z.number().min(0).max(200).default(60)
  }),
  stagePosition: z.enum(['top', 'bottom', 'left', 'right']).default('top'),
  shape: z.enum(['rectangular', 'curved', 'horseshoe', 'circular', 'custom']).default('rectangular'),
  curveRadius: z.number().min(100).max(5000).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#1a1a2e'),
  showGrid: z.boolean().default(false),
  rowLabelsPosition: z.enum(['left', 'right', 'both']).default('left')
});

// ============================================================================
// STAGE VALIDATION SCHEMAS
// ============================================================================

const stageSchema = z.object({
  label: z.string().max(30).default('SCREEN'),
  widthPercent: z.number().min(20).max(100).default(80),
  height: z.number().min(10).max(100).default(20),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
  glowEffect: z.boolean().default(true)
});

// ============================================================================
// MAIN VENUE TEMPLATE VALIDATION SCHEMAS
// ============================================================================

export const createVenueTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  venueId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid venue ID'),
  screenId: z.string().optional(),
  screenName: z.string().max(50).optional(),
  screenType: z.enum(['standard', 'imax', 'dolby', '4dx', 'screenx', 'premium', 'outdoor']).default('standard'),
  layout: layoutConfigSchema,
  stage: stageSchema,
  seats: z.array(seatSchema).min(1, 'At least one seat is required'),
  sections: z.array(sectionSchema).min(1, 'At least one section is required'),
  aisles: z.array(aisleSchema).default([]),
  isDraft: z.boolean().default(true)
});

export const updateVenueTemplateSchema = createVenueTemplateSchema.partial().omit({ venueId: true });

export const generateLayoutSchema = z.object({
  venueId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid venue ID'),
  name: z.string().min(1).max(100),
  screenId: z.string().optional(),
  screenName: z.string().max(50).optional(),
  screenType: z.enum(['standard', 'imax', 'dolby', '4dx', 'screenx', 'premium', 'outdoor']).default('standard'),
  layoutType: z.enum(['rectangular', 'curved', 'stadium']).default('rectangular'),
  rows: z.number().int().min(1).max(50),
  seatsPerRow: z.number().int().min(1).max(60),
  basePrice: z.number().min(0),
  options: z.object({
    aisleAfterColumn: z.array(z.number().int().min(0)).optional(),
    aisleAfterRow: z.array(z.number().int().min(0)).optional(),
    vipRows: z.array(z.number().int().min(0)).optional(),
    premiumRows: z.array(z.number().int().min(0)).optional(),
    curveRadius: z.number().min(100).max(5000).optional()
  }).optional()
});

export const cloneTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  venueId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid venue ID').optional(),
  screenId: z.string().optional(),
  screenName: z.string().max(50).optional()
});

export const updateSeatSchema = z.object({
  seatId: z.string(),
  updates: z.object({
    seatLabel: z.string().max(20).optional(),
    category: z.enum(['standard', 'premium', 'vip', 'recliner', 'wheelchair', 'companion', 'loveseat', 'balcony']).optional(),
    priceMultiplier: z.number().min(0.1).max(10).optional(),
    status: z.enum(['active', 'inactive', 'maintenance', 'removed']).optional(),
    rotation: z.number().min(-180).max(180).optional(),
    attributes: seatAttributesSchema,
    dimensions: seatDimensionsSchema
  })
});

export const bulkUpdateSeatsSchema = z.object({
  seatIds: z.array(z.string()).min(1),
  updates: z.object({
    category: z.enum(['standard', 'premium', 'vip', 'recliner', 'wheelchair', 'companion', 'loveseat', 'balcony']).optional(),
    priceMultiplier: z.number().min(0.1).max(10).optional(),
    status: z.enum(['active', 'inactive', 'maintenance', 'removed']).optional()
  })
});

export const addSeatsSchema = z.object({
  seats: z.array(seatSchema).min(1)
});

export const removeSeatsSchema = z.object({
  seatIds: z.array(z.string()).min(1)
});

export type CreateVenueTemplateInput = z.infer<typeof createVenueTemplateSchema>;
export type UpdateVenueTemplateInput = z.infer<typeof updateVenueTemplateSchema>;
export type GenerateLayoutInput = z.infer<typeof generateLayoutSchema>;
export type CloneTemplateInput = z.infer<typeof cloneTemplateSchema>;
export type UpdateSeatInput = z.infer<typeof updateSeatSchema>;
export type BulkUpdateSeatsInput = z.infer<typeof bulkUpdateSeatsSchema>;
export type AddSeatsInput = z.infer<typeof addSeatsSchema>;
export type RemoveSeatsInput = z.infer<typeof removeSeatsSchema>;
