'use client';

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';
import type Konva from 'konva';
import { cn } from '@/lib/utils';
import type {
  VenueTemplateData,
  SparseSeat,
  SparseSection,
  RuntimeSeat,
  RuntimeSeatStatus,
  ViewportState,
  SeatSelectionState,
} from '@/types/seat';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface InteractiveSeatMapProps {
  /** Venue template data with sparse matrix layout */
  template: VenueTemplateData;
  /** Set of booked seat IDs */
  bookedSeats: Set<string>;
  /** Set of locked seat IDs (by other users) */
  lockedSeats?: Set<string>;
  /** Currently selected seats */
  selectedSeats: RuntimeSeat[];
  /** Maximum number of seats that can be selected */
  maxSeats: number;
  /** Callback when a seat is selected */
  onSeatSelect: (seat: RuntimeSeat) => void;
  /** Callback when a seat is deselected */
  onSeatDeselect: (seatId: string) => void;
  /** Callback when selection changes */
  onSelectionChange?: (selection: SeatSelectionState) => void;
  /** Whether the map is disabled */
  disabled?: boolean;
  /** Show minimap navigation */
  showMinimap?: boolean;
  /** Show zoom controls */
  showZoomControls?: boolean;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// COLOR CONSTANTS
// ============================================================================

const SEAT_COLORS = {
  available: {
    fill: '#22c55e',
    stroke: '#16a34a',
    hoverFill: '#4ade80',
  },
  booked: {
    fill: '#374151',
    stroke: '#4b5563',
    hoverFill: '#374151',
  },
  locked: {
    fill: '#eab308',
    stroke: '#ca8a04',
    hoverFill: '#eab308',
  },
  selected: {
    fill: '#6366f1',
    stroke: '#4f46e5',
    hoverFill: '#818cf8',
  },
  disabled: {
    fill: '#1f2937',
    stroke: '#374151',
    hoverFill: '#1f2937',
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  standard: '#22c55e',
  premium: '#3b82f6',
  vip: '#a855f7',
  recliner: '#f59e0b',
  wheelchair: '#06b6d4',
  companion: '#06b6d4',
  loveseat: '#ec4899',
  balcony: '#8b5cf6',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateSeatPrice(seat: SparseSeat, sections: SparseSection[]): number {
  const section = sections.find(s => s.category === seat.category);
  return section ? section.basePrice * seat.priceMultiplier : 0;
}

function getSeatRuntimeStatus(
  seat: SparseSeat,
  bookedSeats: Set<string>,
  lockedSeats: Set<string>,
  selectedSeats: RuntimeSeat[]
): RuntimeSeatStatus {
  if (seat.status !== 'active') return 'disabled';
  if (bookedSeats.has(seat.seatId)) return 'booked';
  if (lockedSeats.has(seat.seatId)) return 'locked';
  if (selectedSeats.some(s => s.seatId === seat.seatId)) return 'selected';
  return 'available';
}

function getSeatColors(status: RuntimeSeatStatus, category: string, isHovered: boolean) {
  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.standard;
  const colors = SEAT_COLORS[status] || SEAT_COLORS.available;

  if (status === 'available') {
    return {
      fill: isHovered ? colors.hoverFill : categoryColor,
      stroke: colors.stroke,
    };
  }

  return {
    fill: isHovered ? colors.hoverFill : colors.fill,
    stroke: colors.stroke,
  };
}

// ============================================================================
// SEAT COMPONENT
// ============================================================================

interface SeatProps {
  seat: RuntimeSeat;
  x: number;
  y: number;
  width: number;
  height: number;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  disabled: boolean;
}

const SeatShape: React.FC<SeatProps> = ({
  seat,
  x,
  y,
  width,
  height,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  disabled,
}) => {
  const colors = getSeatColors(seat.runtimeStatus, seat.category, isHovered);
  const isClickable = !disabled && (seat.runtimeStatus === 'available' || seat.runtimeStatus === 'selected');
  const cornerRadius = 4;
  const rotation = seat.rotation || 0;

  return (
    <Group
      x={x + width / 2}
      y={y + height / 2}
      rotation={rotation}
      onClick={isClickable ? onClick : undefined}
      onTap={isClickable ? onClick : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Seat background */}
      <Rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={seat.runtimeStatus === 'selected' ? 2 : 1}
        cornerRadius={cornerRadius}
        shadowColor={seat.runtimeStatus === 'selected' ? '#6366f1' : undefined}
        shadowBlur={seat.runtimeStatus === 'selected' ? 8 : 0}
        shadowOpacity={0.5}
        opacity={seat.runtimeStatus === 'disabled' ? 0.3 : 1}
      />
      
      {/* Seat label (only show when zoomed in enough) */}
      <Text
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        text={seat.seatLabel}
        fontSize={10}
        fontFamily="Inter, sans-serif"
        fill={seat.runtimeStatus === 'available' || seat.runtimeStatus === 'selected' ? '#fff' : '#9ca3af'}
        align="center"
        verticalAlign="middle"
        listening={false}
      />
      
      {/* Selection indicator */}
      {seat.runtimeStatus === 'selected' && (
        <Text
          x={width / 2 - 8}
          y={-height / 2 - 8}
          text="✓"
          fontSize={12}
          fill="#fff"
          listening={false}
        />
      )}
      
      {/* Wheelchair icon */}
      {seat.category === 'wheelchair' && (
        <Text
          x={-width / 2}
          y={-height / 2 + 2}
          width={width}
          text="♿"
          fontSize={12}
          align="center"
          listening={false}
        />
      )}
    </Group>
  );
};

// ============================================================================
// SCREEN/STAGE COMPONENT
// ============================================================================

interface StageDisplayProps {
  stage: VenueTemplateData['stage'];
  canvasWidth: number;
  padding: VenueTemplateData['layout']['padding'];
}

const StageDisplay: React.FC<StageDisplayProps> = ({ stage, canvasWidth, padding }) => {
  const stageWidth = (canvasWidth - padding.left - padding.right) * (stage.widthPercent / 100);
  const stageX = padding.left + (canvasWidth - padding.left - padding.right - stageWidth) / 2;

  return (
    <Group>
      {/* Screen glow effect */}
      {stage.glowEffect && (
        <Rect
          x={stageX - 10}
          y={padding.top - 20}
          width={stageWidth + 20}
          height={stage.height + 30}
          fill="transparent"
          shadowColor={stage.color}
          shadowBlur={20}
          shadowOpacity={0.5}
          cornerRadius={4}
        />
      )}
      
      {/* Screen */}
      <Rect
        x={stageX}
        y={padding.top}
        width={stageWidth}
        height={stage.height}
        fill={stage.color}
        cornerRadius={4}
      />
      
      {/* Screen gradient overlay */}
      <Rect
        x={stageX}
        y={padding.top + stage.height}
        width={stageWidth}
        height={20}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 0, y: 20 }}
        fillLinearGradientColorStops={[0, `${stage.color}40`, 1, 'transparent']}
      />
      
      {/* Screen label */}
      <Text
        x={stageX}
        y={padding.top + stage.height + 8}
        width={stageWidth}
        text={stage.label}
        fontSize={12}
        fontFamily="Inter, sans-serif"
        fill="#9ca3af"
        align="center"
      />
    </Group>
  );
};

// ============================================================================
// ROW LABELS COMPONENT
// ============================================================================

interface RowLabelsProps {
  seats: RuntimeSeat[];
  layout: VenueTemplateData['layout'];
  seatPositions: Map<string, { x: number; y: number; width: number; height: number }>;
}

const RowLabels: React.FC<RowLabelsProps> = ({ seats, layout, seatPositions }) => {
  // Get unique rows with their positions
  const rowLabels = useMemo(() => {
    const rows = new Map<number, { label: string; y: number }>();
    
    seats.forEach(seat => {
      const pos = seatPositions.get(seat.seatId);
      if (pos && !rows.has(seat.rowIndex)) {
        rows.set(seat.rowIndex, {
          label: seat.rowLabel,
          y: pos.y + pos.height / 2,
        });
      }
    });
    
    return Array.from(rows.values());
  }, [seats, seatPositions]);

  return (
    <>
      {rowLabels.map((row, index) => (
        <React.Fragment key={index}>
          {(layout.rowLabelsPosition === 'left' || layout.rowLabelsPosition === 'both') && (
            <Text
              x={10}
              y={row.y - 6}
              text={row.label}
              fontSize={12}
              fontFamily="Inter, sans-serif"
              fill="#6b7280"
            />
          )}
          {(layout.rowLabelsPosition === 'right' || layout.rowLabelsPosition === 'both') && (
            <Text
              x={layout.maxColumns * (layout.defaultSeatSize.width + layout.seatGap.horizontal) + layout.padding.left + 10}
              y={row.y - 6}
              text={row.label}
              fontSize={12}
              fontFamily="Inter, sans-serif"
              fill="#6b7280"
            />
          )}
        </React.Fragment>
      ))}
    </>
  );
};

// ============================================================================
// ZOOM CONTROLS COMPONENT
// ============================================================================

interface ZoomControlsProps {
  scale: number;
  minScale: number;
  maxScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  scale,
  minScale,
  maxScale,
  onZoomIn,
  onZoomOut,
  onReset,
}) => {
  const zoomPercent = Math.round(scale * 100);

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-surface-card rounded-lg p-2 shadow-lg border border-gray-700">
      <button
        onClick={onZoomIn}
        disabled={scale >= maxScale}
        className="p-2 rounded hover:bg-surface-active disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Zoom In"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
      
      <div className="text-center text-sm font-medium text-gray-400">
        {zoomPercent}%
      </div>
      
      <button
        onClick={onZoomOut}
        disabled={scale <= minScale}
        className="p-2 rounded hover:bg-surface-active disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Zoom Out"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      
      <div className="border-t border-gray-700 my-1" />
      
      <button
        onClick={onReset}
        className="p-2 rounded hover:bg-surface-active transition-colors"
        title="Reset View"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
};

// ============================================================================
// LEGEND COMPONENT
// ============================================================================

interface LegendProps {
  sections: SparseSection[];
}

const Legend: React.FC<LegendProps> = ({ sections }) => {
  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.displayOrder - b.displayOrder),
    [sections]
  );

  return (
    <div className="flex flex-wrap gap-4 justify-center p-4 bg-surface-card rounded-lg border border-gray-700">
      {/* Status legends */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: SEAT_COLORS.available.fill }} />
        <span className="text-sm text-gray-400">Available</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: SEAT_COLORS.selected.fill }} />
        <span className="text-sm text-gray-400">Selected</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: SEAT_COLORS.booked.fill }} />
        <span className="text-sm text-gray-400">Booked</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: SEAT_COLORS.locked.fill }} />
        <span className="text-sm text-gray-400">Processing</span>
      </div>
      
      {/* Divider */}
      <div className="border-l border-gray-700 h-6" />
      
      {/* Category legends */}
      {sortedSections.map(section => (
        <div key={section.sectionId} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: section.color }} />
          <span className="text-sm text-gray-400">
            {section.name} (₹{section.basePrice})
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// SEAT TOOLTIP COMPONENT
// ============================================================================

interface SeatTooltipProps {
  seat: RuntimeSeat | null;
  position: { x: number; y: number };
}

const SeatTooltip: React.FC<SeatTooltipProps> = ({ seat, position }) => {
  if (!seat) return null;

  return (
    <div
      className="absolute z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
      style={{ left: position.x, top: position.y - 10 }}
    >
      <div className="text-sm font-medium">{seat.seatLabel}</div>
      <div className="text-xs text-gray-400">{seat.category.toUpperCase()}</div>
      <div className="text-sm font-semibold text-primary-400">₹{seat.price}</div>
      {seat.attributes?.hasObstructedView && (
        <div className="text-xs text-yellow-400">⚠️ Obstructed View</div>
      )}
      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const InteractiveSeatMap: React.FC<InteractiveSeatMapProps> = ({
  template,
  bookedSeats,
  lockedSeats = new Set(),
  selectedSeats,
  maxSeats,
  onSeatSelect,
  onSeatDeselect,
  onSelectionChange,
  disabled = false,
  showMinimap = false,
  showZoomControls = true,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  
  // Canvas dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  // Viewport state (zoom/pan)
  const [viewport, setViewport] = useState<ViewportState>({
    scale: 1,
    minScale: 0.3,
    maxScale: 3,
    position: { x: 0, y: 0 },
    isDragging: false,
  });
  
  // Hovered seat
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);
  const [tooltipSeat, setTooltipSeat] = useState<{ seat: RuntimeSeat; position: { x: number; y: number } } | null>(null);

  // Calculate canvas size based on layout
  const canvasSize = useMemo(() => {
    const { layout } = template;
    const width = layout.maxColumns * (layout.defaultSeatSize.width + layout.seatGap.horizontal) + 
                  layout.padding.left + layout.padding.right;
    const height = layout.maxRows * (layout.defaultSeatSize.height + layout.seatGap.vertical) + 
                   layout.padding.top + layout.padding.bottom + template.stage.height + 40;
    return { width, height };
  }, [template]);

  // Convert sparse seats to runtime seats with positions
  const { runtimeSeats, seatPositions } = useMemo(() => {
    const { layout, seats, sections, stage } = template;
    const runtimeSeats: RuntimeSeat[] = [];
    const seatPositions = new Map<string, { x: number; y: number; width: number; height: number }>();
    
    const stageOffset = stage.height + 40;
    
    for (const seat of seats) {
      const runtimeStatus = getSeatRuntimeStatus(seat, bookedSeats, lockedSeats, selectedSeats);
      const price = calculateSeatPrice(seat, sections);
      const section = sections.find(s => s.category === seat.category);
      
      const runtimeSeat: RuntimeSeat = {
        ...seat,
        runtimeStatus,
        price,
        section,
      };
      
      runtimeSeats.push(runtimeSeat);
      
      // Calculate position
      const seatWidth = seat.dimensions?.width || layout.defaultSeatSize.width;
      const seatHeight = seat.dimensions?.height || layout.defaultSeatSize.height;
      
      const x = layout.padding.left + seat.colIndex * (layout.defaultSeatSize.width + layout.seatGap.horizontal);
      const y = layout.padding.top + stageOffset + seat.rowIndex * (layout.defaultSeatSize.height + layout.seatGap.vertical);
      
      seatPositions.set(seat.seatId, { x, y, width: seatWidth, height: seatHeight });
    }
    
    return { runtimeSeats, seatPositions };
  }, [template, bookedSeats, lockedSeats, selectedSeats]);

  // Handle seat click
  const handleSeatClick = useCallback((seat: RuntimeSeat) => {
    if (disabled) return;
    
    if (seat.runtimeStatus === 'selected') {
      onSeatDeselect(seat.seatId);
    } else if (seat.runtimeStatus === 'available') {
      if (selectedSeats.length < maxSeats) {
        onSeatSelect(seat);
      }
    }
  }, [disabled, selectedSeats.length, maxSeats, onSeatSelect, onSeatDeselect]);

  // Handle seat hover
  const handleSeatHover = useCallback((seat: RuntimeSeat | null, event?: Konva.KonvaEventObject<MouseEvent>) => {
    if (seat) {
      setHoveredSeatId(seat.seatId);
      if (event && stageRef.current) {
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const pos = seatPositions.get(seat.seatId);
          if (pos) {
            setTooltipSeat({
              seat,
              position: {
                x: (pos.x + pos.width / 2) * viewport.scale + viewport.position.x,
                y: (pos.y) * viewport.scale + viewport.position.y,
              },
            });
          }
        }
      }
    } else {
      setHoveredSeatId(null);
      setTooltipSeat(null);
    }
  }, [seatPositions, viewport]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, prev.maxScale),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, prev.minScale),
    }));
  }, []);

  const handleZoomReset = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      scale: 1,
      position: { x: 0, y: 0 },
    }));
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const oldScale = viewport.scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const mousePointTo = {
      x: (pointer.x - viewport.position.x) / oldScale,
      y: (pointer.y - viewport.position.y) / oldScale,
    };
    
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.1;
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(viewport.minScale, Math.min(viewport.maxScale, newScale));
    
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    
    setViewport(prev => ({
      ...prev,
      scale: newScale,
      position: newPos,
    }));
  }, [viewport]);

  // Handle drag
  const handleDragStart = useCallback(() => {
    setViewport(prev => ({ ...prev, isDragging: true }));
  }, []);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    setViewport(prev => ({
      ...prev,
      isDragging: false,
      position: { x: e.target.x(), y: e.target.y() },
    }));
  }, []);

  // Update selection callback
  useEffect(() => {
    if (onSelectionChange) {
      const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
      onSelectionChange({
        selectedSeats,
        totalPrice,
        maxSeats,
        canSelectMore: selectedSeats.length < maxSeats,
      });
    }
  }, [selectedSeats, maxSeats, onSelectionChange]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Auto-fit on mount
  useEffect(() => {
    if (dimensions.width > 0 && canvasSize.width > 0) {
      const scaleX = dimensions.width / canvasSize.width;
      const scaleY = dimensions.height / canvasSize.height;
      const scale = Math.min(scaleX, scaleY, 1);
      
      const offsetX = (dimensions.width - canvasSize.width * scale) / 2;
      const offsetY = (dimensions.height - canvasSize.height * scale) / 2;
      
      setViewport(prev => ({
        ...prev,
        scale,
        position: { x: offsetX, y: offsetY },
      }));
    }
  }, [dimensions, canvasSize]);

  return (
    <div className={cn('relative w-full h-full min-h-[400px]', className)} ref={containerRef}>
      {/* Seat Tooltip */}
      {tooltipSeat && <SeatTooltip seat={tooltipSeat.seat} position={tooltipSeat.position} />}
      
      {/* Canvas */}
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        x={viewport.position.x}
        y={viewport.position.y}
        draggable
        onWheel={handleWheel}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="cursor-grab active:cursor-grabbing"
      >
        <Layer>
          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={canvasSize.width}
            height={canvasSize.height}
            fill={template.layout.backgroundColor || '#1a1a2e'}
          />
          
          {/* Stage/Screen */}
          <StageDisplay
            stage={template.stage}
            canvasWidth={canvasSize.width}
            padding={template.layout.padding}
          />
          
          {/* Row Labels */}
          <RowLabels
            seats={runtimeSeats}
            layout={template.layout}
            seatPositions={seatPositions}
          />
          
          {/* Seats */}
          {runtimeSeats.map(seat => {
            const pos = seatPositions.get(seat.seatId);
            if (!pos) return null;
            
            return (
              <SeatShape
                key={seat.seatId}
                seat={seat}
                x={pos.x}
                y={pos.y}
                width={pos.width}
                height={pos.height}
                isHovered={hoveredSeatId === seat.seatId}
                onClick={() => handleSeatClick(seat)}
                onMouseEnter={(e?: Konva.KonvaEventObject<MouseEvent>) => handleSeatHover(seat, e)}
                onMouseLeave={() => handleSeatHover(null)}
                disabled={disabled}
              />
            );
          })}
        </Layer>
      </Stage>
      
      {/* Zoom Controls */}
      {showZoomControls && (
        <ZoomControls
          scale={viewport.scale}
          minScale={viewport.minScale}
          maxScale={viewport.maxScale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleZoomReset}
        />
      )}
      
      {/* Touch instructions for mobile */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-500 hidden md:block">
        Scroll to zoom • Drag to pan
      </div>
      
      {/* Legend */}
      <div className="absolute top-4 left-4 right-4">
        <Legend sections={template.sections} />
      </div>
    </div>
  );
};

export default InteractiveSeatMap;
