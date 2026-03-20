'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Transformer } from 'react-konva';
import type Konva from 'konva';
import { cn } from '@/lib/utils';
import type {
  SparseSeat,
  SparseSection,
  SparseLayoutConfig,
  SparseStage,
  SparseSeatCategory,
} from '@/types/seat';

// ============================================================================
// TYPES
// ============================================================================

interface BuilderSeat extends SparseSeat {
  isSelected?: boolean;
}

interface BuilderState {
  name: string;
  screenName: string;
  screenType: 'standard' | 'imax' | 'dolby' | '4dx' | 'screenx' | 'premium' | 'outdoor';
  layout: SparseLayoutConfig;
  stage: SparseStage;
  seats: BuilderSeat[];
  sections: SparseSection[];
}

type ToolMode = 'select' | 'add' | 'delete' | 'paint' | 'pan';

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_COLORS: Record<SparseSeatCategory, string> = {
  standard: '#22c55e',
  premium: '#3b82f6',
  vip: '#a855f7',
  recliner: '#f59e0b',
  wheelchair: '#06b6d4',
  companion: '#06b6d4',
  loveseat: '#ec4899',
  balcony: '#8b5cf6',
};

const DEFAULT_SECTIONS: SparseSection[] = [
  { sectionId: 'standard', name: 'Standard', category: 'standard', basePrice: 150, color: '#22c55e', displayOrder: 1 },
  { sectionId: 'premium', name: 'Premium', category: 'premium', basePrice: 250, color: '#3b82f6', displayOrder: 2 },
  { sectionId: 'vip', name: 'VIP', category: 'vip', basePrice: 400, color: '#a855f7', displayOrder: 3 },
  { sectionId: 'recliner', name: 'Recliner', category: 'recliner', basePrice: 500, color: '#f59e0b', displayOrder: 4 },
  { sectionId: 'wheelchair', name: 'Wheelchair', category: 'wheelchair', basePrice: 150, color: '#06b6d4', displayOrder: 5 },
];

const INITIAL_STATE: BuilderState = {
  name: 'New Layout Template',
  screenName: 'Screen 1',
  screenType: 'standard',
  layout: {
    maxRows: 15,
    maxColumns: 20,
    defaultSeatSize: { width: 28, height: 28 },
    seatGap: { horizontal: 4, vertical: 6 },
    padding: { top: 80, right: 40, bottom: 40, left: 60 },
    stagePosition: 'top',
    shape: 'rectangular',
    backgroundColor: '#1a1a2e',
    showGrid: true,
    rowLabelsPosition: 'left',
  },
  stage: {
    label: 'SCREEN',
    widthPercent: 80,
    height: 20,
    color: '#6366f1',
    glowEffect: true,
  },
  seats: [],
  sections: DEFAULT_SECTIONS,
};

// ============================================================================
// TOOLBAR COMPONENT
// ============================================================================

interface ToolbarProps {
  currentTool: ToolMode;
  onToolChange: (tool: ToolMode) => void;
  currentCategory: SparseSeatCategory;
  onCategoryChange: (category: SparseSeatCategory) => void;
  onGenerateGrid: () => void;
  onClearAll: () => void;
  onSave: () => void;
  onExport: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  currentCategory,
  onCategoryChange,
  onGenerateGrid,
  onClearAll,
  onSave,
  onExport,
}) => {
  const tools: { id: ToolMode; label: string; icon: React.ReactNode }[] = [
    {
      id: 'select',
      label: 'Select',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
    },
    {
      id: 'add',
      label: 'Add Seat',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
    {
      id: 'paint',
      label: 'Paint Category',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
    {
      id: 'pan',
      label: 'Pan',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-surface-card border-b border-gray-800 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Tools */}
        <div className="flex items-center gap-1 bg-surface-active rounded-lg p-1">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentTool === tool.id
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              )}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Category Selector */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Category:</span>
          <div className="flex items-center gap-1">
            {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category as SparseSeatCategory)}
                className={cn(
                  'w-7 h-7 rounded-lg border-2 transition-all',
                  currentCategory === category
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                )}
                style={{ backgroundColor: color }}
                title={category.charAt(0).toUpperCase() + category.slice(1)}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 border-l border-gray-700" />

        {/* Quick Actions */}
        <button
          onClick={onGenerateGrid}
          className="px-3 py-2 bg-surface-active text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
        >
          Generate Grid
        </button>
        <button
          onClick={onClearAll}
          className="px-3 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
        >
          Clear All
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Save/Export */}
        <button
          onClick={onExport}
          className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
        >
          Export JSON
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
        >
          Save Template
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// PROPERTIES PANEL COMPONENT
// ============================================================================

interface PropertiesPanelProps {
  state: BuilderState;
  selectedSeats: BuilderSeat[];
  onStateChange: (updates: Partial<BuilderState>) => void;
  onSelectedSeatsChange: (updates: Partial<BuilderSeat>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  state,
  selectedSeats,
  onStateChange,
  onSelectedSeatsChange,
}) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'sections' | 'seat'>('layout');

  return (
    <div className="w-80 bg-surface-card border-l border-gray-800 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {(['layout', 'sections', 'seat'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-400 hover:text-white'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'layout' && (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Template Name</label>
              <input
                type="text"
                value={state.name}
                onChange={(e) => onStateChange({ name: e.target.value })}
                className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Screen Name</label>
              <input
                type="text"
                value={state.screenName}
                onChange={(e) => onStateChange({ screenName: e.target.value })}
                className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Screen Type</label>
              <select
                value={state.screenType}
                onChange={(e) => onStateChange({ screenType: e.target.value as BuilderState['screenType'] })}
                className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="standard">Standard</option>
                <option value="imax">IMAX</option>
                <option value="dolby">Dolby Atmos</option>
                <option value="4dx">4DX</option>
                <option value="screenx">ScreenX</option>
                <option value="premium">Premium</option>
                <option value="outdoor">Outdoor</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Rows</label>
                <input
                  type="number"
                  value={state.layout.maxRows}
                  onChange={(e) => onStateChange({
                    layout: { ...state.layout, maxRows: parseInt(e.target.value) || 1 }
                  })}
                  min={1}
                  max={50}
                  className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Columns</label>
                <input
                  type="number"
                  value={state.layout.maxColumns}
                  onChange={(e) => onStateChange({
                    layout: { ...state.layout, maxColumns: parseInt(e.target.value) || 1 }
                  })}
                  min={1}
                  max={60}
                  className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Seat Width</label>
                <input
                  type="number"
                  value={state.layout.defaultSeatSize.width}
                  onChange={(e) => onStateChange({
                    layout: {
                      ...state.layout,
                      defaultSeatSize: { ...state.layout.defaultSeatSize, width: parseInt(e.target.value) || 20 }
                    }
                  })}
                  min={15}
                  max={60}
                  className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Seat Height</label>
                <input
                  type="number"
                  value={state.layout.defaultSeatSize.height}
                  onChange={(e) => onStateChange({
                    layout: {
                      ...state.layout,
                      defaultSeatSize: { ...state.layout.defaultSeatSize, height: parseInt(e.target.value) || 20 }
                    }
                  })}
                  min={15}
                  max={60}
                  className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Show Grid</label>
              <button
                onClick={() => onStateChange({
                  layout: { ...state.layout, showGrid: !state.layout.showGrid }
                })}
                className={cn(
                  'w-10 h-6 rounded-full transition-colors',
                  state.layout.showGrid ? 'bg-primary-500' : 'bg-gray-600'
                )}
              >
                <div className={cn(
                  'w-4 h-4 bg-white rounded-full transition-transform mx-1',
                  state.layout.showGrid ? 'translate-x-4' : 'translate-x-0'
                )} />
              </button>
            </div>

            {/* Stats */}
            <div className="mt-6 p-4 bg-surface-active rounded-lg">
              <h4 className="text-sm font-medium text-white mb-3">Layout Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Seats</span>
                  <span className="text-white">{state.seats.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Seats</span>
                  <span className="text-green-400">
                    {state.seats.filter(s => s.status === 'active').length}
                  </span>
                </div>
                {Object.entries(CATEGORY_COLORS).map(([category, color]) => {
                  const count = state.seats.filter(s => s.category === category).length;
                  if (count === 0) return null;
                  return (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-2">
                        <span className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                        {category}
                      </span>
                      <span className="text-white">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activeTab === 'sections' && (
          <>
            <p className="text-gray-400 text-sm mb-4">
              Configure pricing sections and categories.
            </p>
            {state.sections.map((section, index) => (
              <div key={section.sectionId} className="p-3 bg-surface-active rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: section.color }}
                    />
                    <span className="text-white font-medium">{section.name}</span>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {state.seats.filter(s => s.category === section.category).length} seats
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Base Price:</span>
                  <input
                    type="number"
                    value={section.basePrice}
                    onChange={(e) => {
                      const newSections = [...state.sections];
                      newSections[index] = { ...section, basePrice: parseFloat(e.target.value) || 0 };
                      onStateChange({ sections: newSections });
                    }}
                    className="flex-1 px-2 py-1 bg-surface-card border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'seat' && (
          <>
            {selectedSeats.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="text-gray-400">Select seats to edit their properties</p>
              </div>
            ) : (
              <>
                <p className="text-gray-400 text-sm mb-4">
                  {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected
                </p>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <select
                    value={selectedSeats.length === 1 ? selectedSeats[0].category : ''}
                    onChange={(e) => onSelectedSeatsChange({ category: e.target.value as SparseSeatCategory })}
                    className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  >
                    {selectedSeats.length > 1 && <option value="">Mixed</option>}
                    {Object.keys(CATEGORY_COLORS).map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select
                    value={selectedSeats.length === 1 ? selectedSeats[0].status : ''}
                    onChange={(e) => onSelectedSeatsChange({ status: e.target.value as BuilderSeat['status'] })}
                    className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  >
                    {selectedSeats.length > 1 && <option value="">Mixed</option>}
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="removed">Removed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Price Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedSeats.length === 1 ? selectedSeats[0].priceMultiplier : 1}
                    onChange={(e) => onSelectedSeatsChange({ priceMultiplier: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  />
                </div>

                {selectedSeats.length === 1 && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Seat Label</label>
                      <input
                        type="text"
                        value={selectedSeats[0].seatLabel}
                        onChange={(e) => onSelectedSeatsChange({ seatLabel: e.target.value })}
                        className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Rotation (degrees)</label>
                      <input
                        type="number"
                        value={selectedSeats[0].rotation || 0}
                        onChange={(e) => onSelectedSeatsChange({ rotation: parseInt(e.target.value) || 0 })}
                        min={-180}
                        max={180}
                        className="w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div className="p-3 bg-surface-active rounded-lg space-y-2">
                      <h4 className="text-sm font-medium text-white">Attributes</h4>
                      {['hasArmrest', 'hasLegroom', 'isAisle', 'isCenter', 'hasObstructedView'].map(attr => (
                        <label key={attr} className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">{attr.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <input
                            type="checkbox"
                            checked={selectedSeats[0].attributes?.[attr as keyof typeof selectedSeats[0]['attributes']] || false}
                            onChange={(e) => onSelectedSeatsChange({
                              attributes: {
                                ...selectedSeats[0].attributes,
                                [attr]: e.target.checked,
                              }
                            })}
                            className="w-4 h-4 rounded border-gray-600 bg-surface-card text-primary-500 focus:ring-primary-500"
                          />
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN SEAT MAP BUILDER PAGE
// ============================================================================

export default function SeatMapBuilderPage() {
  const stageRef = useRef<Konva.Stage>(null);
  const [state, setState] = useState<BuilderState>(INITIAL_STATE);
  const [tool, setTool] = useState<ToolMode>('select');
  const [currentCategory, setCurrentCategory] = useState<SparseSeatCategory>('standard');
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Calculate canvas dimensions
  const canvasSize = useMemo(() => {
    const { layout, stage } = state;
    const width = layout.maxColumns * (layout.defaultSeatSize.width + layout.seatGap.horizontal) +
                  layout.padding.left + layout.padding.right;
    const height = layout.maxRows * (layout.defaultSeatSize.height + layout.seatGap.vertical) +
                   layout.padding.top + layout.padding.bottom + stage.height + 40;
    return { width, height };
  }, [state.layout, state.stage]);

  // Get selected seats
  const selectedSeats = useMemo(() => 
    state.seats.filter(s => selectedSeatIds.has(s.seatId)),
    [state.seats, selectedSeatIds]
  );

  // Calculate seat position
  const getSeatPosition = useCallback((rowIndex: number, colIndex: number) => {
    const { layout, stage } = state;
    const x = layout.padding.left + colIndex * (layout.defaultSeatSize.width + layout.seatGap.horizontal);
    const y = layout.padding.top + stage.height + 40 + rowIndex * (layout.defaultSeatSize.height + layout.seatGap.vertical);
    return { x, y };
  }, [state.layout, state.stage]);

  // Get grid position from canvas coordinates
  const getGridPosition = useCallback((canvasX: number, canvasY: number) => {
    const { layout, stage } = state;
    const offsetX = canvasX - layout.padding.left;
    const offsetY = canvasY - layout.padding.top - stage.height - 40;
    
    const colIndex = Math.floor(offsetX / (layout.defaultSeatSize.width + layout.seatGap.horizontal));
    const rowIndex = Math.floor(offsetY / (layout.defaultSeatSize.height + layout.seatGap.vertical));
    
    return {
      rowIndex: Math.max(0, Math.min(layout.maxRows - 1, rowIndex)),
      colIndex: Math.max(0, Math.min(layout.maxColumns - 1, colIndex)),
    };
  }, [state.layout, state.stage]);

  // Generate row label
  const getRowLabel = (rowIndex: number): string => {
    const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return rowIndex < 26 ? labels[rowIndex] : `R${rowIndex + 1}`;
  };

  // Handle stage update
  const handleStateChange = useCallback((updates: Partial<BuilderState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle selected seats update
  const handleSelectedSeatsChange = useCallback((updates: Partial<BuilderSeat>) => {
    setState(prev => ({
      ...prev,
      seats: prev.seats.map(seat => 
        selectedSeatIds.has(seat.seatId) ? { ...seat, ...updates } : seat
      ),
    }));
  }, [selectedSeatIds]);

  // Add a seat
  const addSeat = useCallback((rowIndex: number, colIndex: number) => {
    const existingSeat = state.seats.find(
      s => s.rowIndex === rowIndex && s.colIndex === colIndex
    );
    
    if (existingSeat) return;
    
    const rowLabel = getRowLabel(rowIndex);
    const seatNumber = colIndex + 1;
    const seatId = `${rowLabel}${seatNumber}`;
    
    const newSeat: BuilderSeat = {
      seatId,
      rowIndex,
      colIndex,
      seatLabel: seatId,
      rowLabel,
      category: currentCategory,
      priceMultiplier: 1,
      status: 'active',
      rotation: 0,
    };
    
    setState(prev => ({
      ...prev,
      seats: [...prev.seats, newSeat],
    }));
  }, [state.seats, currentCategory]);

  // Delete a seat
  const deleteSeat = useCallback((seatId: string) => {
    setState(prev => ({
      ...prev,
      seats: prev.seats.filter(s => s.seatId !== seatId),
    }));
    setSelectedSeatIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(seatId);
      return newSet;
    });
  }, []);

  // Paint a seat category
  const paintSeat = useCallback((seatId: string) => {
    setState(prev => ({
      ...prev,
      seats: prev.seats.map(s => 
        s.seatId === seatId ? { ...s, category: currentCategory } : s
      ),
    }));
  }, [currentCategory]);

  // Handle canvas click
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const scaledPos = {
      x: (pos.x - viewport.x) / viewport.scale,
      y: (pos.y - viewport.y) / viewport.scale,
    };

    const gridPos = getGridPosition(scaledPos.x, scaledPos.y);

    switch (tool) {
      case 'add':
        addSeat(gridPos.rowIndex, gridPos.colIndex);
        break;
      case 'select':
        // Clear selection if clicking on empty space
        if (e.target === stage) {
          setSelectedSeatIds(new Set());
        }
        break;
    }
  }, [tool, viewport, getGridPosition, addSeat]);

  // Handle seat click
  const handleSeatClick = useCallback((seatId: string, e: Konva.KonvaEventObject<Event>) => {
    e.cancelBubble = true;
    const nativeEvent = e.evt as MouseEvent | TouchEvent;
    const hasModifierKeys =
      'shiftKey' in nativeEvent &&
      (nativeEvent.shiftKey || nativeEvent.ctrlKey || nativeEvent.metaKey);

    switch (tool) {
      case 'select':
        if (hasModifierKeys) {
          // Multi-select
          setSelectedSeatIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(seatId)) {
              newSet.delete(seatId);
            } else {
              newSet.add(seatId);
            }
            return newSet;
          });
        } else {
          // Single select
          setSelectedSeatIds(new Set([seatId]));
        }
        break;
      case 'delete':
        deleteSeat(seatId);
        break;
      case 'paint':
        paintSeat(seatId);
        break;
    }
  }, [tool, deleteSeat, paintSeat]);

  // Generate grid
  const handleGenerateGrid = useCallback(() => {
    const newSeats: BuilderSeat[] = [];
    const { maxRows, maxColumns } = state.layout;

    for (let row = 0; row < maxRows; row++) {
      const rowLabel = getRowLabel(row);
      for (let col = 0; col < maxColumns; col++) {
        const seatNumber = col + 1;
        const seatId = `${rowLabel}${seatNumber}`;
        
        let category: SparseSeatCategory = 'standard';
        if (row >= maxRows - 2) {
          category = 'vip';
        } else if (row >= maxRows - 4) {
          category = 'premium';
        }

        newSeats.push({
          seatId,
          rowIndex: row,
          colIndex: col,
          seatLabel: seatId,
          rowLabel,
          category,
          priceMultiplier: 1,
          status: 'active',
          rotation: 0,
        });
      }
    }

    setState(prev => ({ ...prev, seats: newSeats }));
    setSelectedSeatIds(new Set());
  }, [state.layout]);

  // Clear all seats
  const handleClearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all seats?')) {
      setState(prev => ({ ...prev, seats: [] }));
      setSelectedSeatIds(new Set());
    }
  }, []);

  // Save template
  const handleSave = useCallback(async () => {
    alert('Save functionality would connect to the API here');
    console.log('Template to save:', state);
  }, [state]);

  // Export JSON
  const handleExport = useCallback(() => {
    const exportData = {
      name: state.name,
      screenName: state.screenName,
      screenType: state.screenType,
      layout: state.layout,
      stage: state.stage,
      seats: state.seats.map(({ isSelected, ...seat }) => seat),
      sections: state.sections,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.name.replace(/\s+/g, '-').toLowerCase()}-layout.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = viewport.scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.1;
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.2, Math.min(3, newScale));

    setViewport({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, [viewport]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6">
      {/* Toolbar */}
      <Toolbar
        currentTool={tool}
        onToolChange={setTool}
        currentCategory={currentCategory}
        onCategoryChange={setCurrentCategory}
        onGenerateGrid={handleGenerateGrid}
        onClearAll={handleClearAll}
        onSave={handleSave}
        onExport={handleExport}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 bg-surface-default overflow-hidden">
          <Stage
            ref={stageRef}
            width={window.innerWidth - 320}
            height={window.innerHeight - 180}
            scaleX={viewport.scale}
            scaleY={viewport.scale}
            x={viewport.x}
            y={viewport.y}
            draggable={tool === 'pan'}
            onWheel={handleWheel}
            onClick={handleStageClick}
            onDragEnd={(e) => {
              setViewport(prev => ({
                ...prev,
                x: e.target.x(),
                y: e.target.y(),
              }));
            }}
          >
            <Layer>
              {/* Background */}
              <Rect
                x={0}
                y={0}
                width={canvasSize.width}
                height={canvasSize.height}
                fill={state.layout.backgroundColor}
              />

              {/* Grid */}
              {state.layout.showGrid && Array.from({ length: state.layout.maxRows }).map((_, row) =>
                Array.from({ length: state.layout.maxColumns }).map((_, col) => {
                  const pos = getSeatPosition(row, col);
                  return (
                    <Rect
                      key={`grid-${row}-${col}`}
                      x={pos.x}
                      y={pos.y}
                      width={state.layout.defaultSeatSize.width}
                      height={state.layout.defaultSeatSize.height}
                      stroke="#2d2d44"
                      strokeWidth={1}
                      dash={[2, 2]}
                    />
                  );
                })
              )}

              {/* Screen */}
              <Group>
                <Rect
                  x={state.layout.padding.left + (canvasSize.width - state.layout.padding.left - state.layout.padding.right) * (1 - state.stage.widthPercent / 100) / 2}
                  y={state.layout.padding.top}
                  width={(canvasSize.width - state.layout.padding.left - state.layout.padding.right) * (state.stage.widthPercent / 100)}
                  height={state.stage.height}
                  fill={state.stage.color}
                  cornerRadius={4}
                  shadowColor={state.stage.color}
                  shadowBlur={state.stage.glowEffect ? 20 : 0}
                  shadowOpacity={0.5}
                />
                <Text
                  x={state.layout.padding.left}
                  y={state.layout.padding.top + state.stage.height + 10}
                  width={canvasSize.width - state.layout.padding.left - state.layout.padding.right}
                  text={state.stage.label}
                  fontSize={12}
                  fill="#9ca3af"
                  align="center"
                />
              </Group>

              {/* Row Labels */}
              {Array.from({ length: state.layout.maxRows }).map((_, row) => {
                const pos = getSeatPosition(row, 0);
                return (
                  <Text
                    key={`row-${row}`}
                    x={10}
                    y={pos.y + state.layout.defaultSeatSize.height / 2 - 6}
                    text={getRowLabel(row)}
                    fontSize={12}
                    fill="#6b7280"
                  />
                );
              })}

              {/* Seats */}
              {state.seats.map(seat => {
                const pos = getSeatPosition(seat.rowIndex, seat.colIndex);
                const color = CATEGORY_COLORS[seat.category];
                const isSelected = selectedSeatIds.has(seat.seatId);

                return (
                  <Group
                    key={seat.seatId}
                    x={pos.x + state.layout.defaultSeatSize.width / 2}
                    y={pos.y + state.layout.defaultSeatSize.height / 2}
                    rotation={seat.rotation || 0}
                    onClick={(e) => handleSeatClick(seat.seatId, e)}
                    onTap={(e) => handleSeatClick(seat.seatId, e)}
                  >
                    <Rect
                      x={-state.layout.defaultSeatSize.width / 2}
                      y={-state.layout.defaultSeatSize.height / 2}
                      width={state.layout.defaultSeatSize.width}
                      height={state.layout.defaultSeatSize.height}
                      fill={seat.status === 'active' ? color : '#374151'}
                      stroke={isSelected ? '#fff' : color}
                      strokeWidth={isSelected ? 2 : 1}
                      cornerRadius={4}
                      shadowColor={isSelected ? '#fff' : undefined}
                      shadowBlur={isSelected ? 8 : 0}
                      opacity={seat.status === 'active' ? 1 : 0.4}
                    />
                    <Text
                      x={-state.layout.defaultSeatSize.width / 2}
                      y={-state.layout.defaultSeatSize.height / 2}
                      width={state.layout.defaultSeatSize.width}
                      height={state.layout.defaultSeatSize.height}
                      text={seat.seatLabel}
                      fontSize={9}
                      fill="#fff"
                      align="center"
                      verticalAlign="middle"
                    />
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        </div>

        {/* Properties Panel */}
        <PropertiesPanel
          state={state}
          selectedSeats={selectedSeats}
          onStateChange={handleStateChange}
          onSelectedSeatsChange={handleSelectedSeatsChange}
        />
      </div>
    </div>
  );
}
