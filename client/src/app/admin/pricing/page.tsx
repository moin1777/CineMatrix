'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface PricingRule {
  id: string;
  name: string;
  description: string;
  type: 'base' | 'time_based' | 'occupancy' | 'day_of_week' | 'special_event' | 'early_bird' | 'last_minute';
  active: boolean;
  priority: number;
  multiplier: number;
  conditions: {
    venues?: string[];
    screens?: string[];
    seatCategories?: string[];
    daysOfWeek?: number[];
    startTime?: string;
    endTime?: string;
    occupancyMin?: number;
    occupancyMax?: number;
    daysBeforeShow?: number;
    hoursBeforeShow?: number;
  };
  effectiveFrom: string;
  effectiveTo: string;
  createdAt: string;
}

interface SeatCategory {
  id: string;
  name: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  dynamicPricingEnabled: boolean;
  maxMultiplier: number;
}

interface PricingPreview {
  category: string;
  basePrice: number;
  finalPrice: number;
  appliedRules: string[];
  multiplier: number;
}

// ============================================================================
// PRICING RULE CARD
// ============================================================================

interface PricingRuleCardProps {
  rule: PricingRule;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

const PricingRuleCard: React.FC<PricingRuleCardProps> = ({ rule, onEdit, onToggle, onDelete }) => {
  const typeIcons: Record<string, JSX.Element> = {
    base: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    time_based: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    occupancy: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    day_of_week: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    special_event: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    early_bird: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    last_minute: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  };

  const typeColors: Record<string, string> = {
    base: 'bg-gray-500/20 text-gray-400',
    time_based: 'bg-blue-500/20 text-blue-400',
    occupancy: 'bg-purple-500/20 text-purple-400',
    day_of_week: 'bg-green-500/20 text-green-400',
    special_event: 'bg-yellow-500/20 text-yellow-400',
    early_bird: 'bg-orange-500/20 text-orange-400',
    last_minute: 'bg-red-500/20 text-red-400',
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={cn(
      'bg-surface-card rounded-xl border overflow-hidden transition-colors',
      rule.active ? 'border-gray-800' : 'border-gray-800/50 opacity-60'
    )}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            typeColors[rule.type]
          )}>
            {typeIcons[rule.type]}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-white truncate">{rule.name}</h3>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                rule.multiplier >= 1 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              )}>
                {rule.multiplier >= 1 ? '+' : ''}{((rule.multiplier - 1) * 100).toFixed(0)}%
              </span>
            </div>
            
            <p className="text-sm text-gray-400 mt-1">{rule.description}</p>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {rule.conditions.daysOfWeek && rule.conditions.daysOfWeek.length > 0 && (
                <span className="px-2 py-1 bg-surface-active rounded text-xs text-gray-400">
                  {rule.conditions.daysOfWeek.map(d => dayNames[d]).join(', ')}
                </span>
              )}
              {rule.conditions.startTime && rule.conditions.endTime && (
                <span className="px-2 py-1 bg-surface-active rounded text-xs text-gray-400">
                  {rule.conditions.startTime} - {rule.conditions.endTime}
                </span>
              )}
              {rule.conditions.occupancyMin !== undefined && rule.conditions.occupancyMax !== undefined && (
                <span className="px-2 py-1 bg-surface-active rounded text-xs text-gray-400">
                  {rule.conditions.occupancyMin}% - {rule.conditions.occupancyMax}% occupancy
                </span>
              )}
              {rule.conditions.daysBeforeShow !== undefined && (
                <span className="px-2 py-1 bg-surface-active rounded text-xs text-gray-400">
                  {rule.conditions.daysBeforeShow}+ days before
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-t border-gray-800">
        <button
          onClick={onToggle}
          className={cn(
            'flex-1 py-2.5 text-sm transition-colors',
            rule.active 
              ? 'text-green-400 hover:bg-green-500/10' 
              : 'text-gray-400 hover:bg-surface-active'
          )}
        >
          {rule.active ? 'Active' : 'Inactive'}
        </button>
        <div className="border-l border-gray-800" />
        <button
          onClick={onEdit}
          className="flex-1 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-surface-active transition-colors"
        >
          Edit
        </button>
        <div className="border-l border-gray-800" />
        <button
          onClick={onDelete}
          className="flex-1 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// SEAT CATEGORY CARD
// ============================================================================

interface SeatCategoryCardProps {
  category: SeatCategory;
  onEdit: () => void;
}

const SeatCategoryCard: React.FC<SeatCategoryCardProps> = ({ category, onEdit }) => {
  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white">{category.name}</h3>
        <button
          onClick={onEdit}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-surface-active rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Base Price</span>
          <span className="text-white font-medium">₹{category.basePrice}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Price Range</span>
          <span className="text-gray-300">₹{category.minPrice} - ₹{category.maxPrice}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Dynamic Pricing</span>
          <span className={category.dynamicPricingEnabled ? 'text-green-400' : 'text-gray-500'}>
            {category.dynamicPricingEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        {category.dynamicPricingEnabled && (
          <div className="flex justify-between">
            <span className="text-gray-400">Max Multiplier</span>
            <span className="text-primary-400">{category.maxMultiplier}x</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// PRICING PREVIEW COMPONENT
// ============================================================================

interface PricingPreviewProps {
  categories: SeatCategory[];
  rules: PricingRule[];
  simulationParams: {
    dayOfWeek: number;
    time: string;
    occupancy: number;
    daysBeforeShow: number;
  };
}

const PricingPreviewComponent: React.FC<PricingPreviewProps> = ({ categories, rules, simulationParams }) => {
  const previews = useMemo(() => {
    return categories.map(cat => {
      let multiplier = 1;
      const appliedRules: string[] = [];
      
      // Sort rules by priority and apply
      const activeRules = rules.filter(r => r.active).sort((a, b) => a.priority - b.priority);
      
      for (const rule of activeRules) {
        let applies = true;
        
        // Check day of week condition
        if (rule.conditions.daysOfWeek && rule.conditions.daysOfWeek.length > 0) {
          if (!rule.conditions.daysOfWeek.includes(simulationParams.dayOfWeek)) {
            applies = false;
          }
        }
        
        // Check time condition
        if (rule.conditions.startTime && rule.conditions.endTime) {
          const [simH, simM] = simulationParams.time.split(':').map(Number);
          const [startH, startM] = rule.conditions.startTime.split(':').map(Number);
          const [endH, endM] = rule.conditions.endTime.split(':').map(Number);
          const simMinutes = simH * 60 + simM;
          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;
          if (simMinutes < startMinutes || simMinutes > endMinutes) {
            applies = false;
          }
        }
        
        // Check occupancy condition
        if (rule.conditions.occupancyMin !== undefined && rule.conditions.occupancyMax !== undefined) {
          if (simulationParams.occupancy < rule.conditions.occupancyMin || 
              simulationParams.occupancy > rule.conditions.occupancyMax) {
            applies = false;
          }
        }
        
        // Check days before show condition
        if (rule.conditions.daysBeforeShow !== undefined) {
          if (simulationParams.daysBeforeShow < rule.conditions.daysBeforeShow) {
            applies = false;
          }
        }
        
        if (applies) {
          multiplier *= rule.multiplier;
          appliedRules.push(rule.name);
        }
      }
      
      // Apply max multiplier cap
      if (cat.dynamicPricingEnabled && multiplier > cat.maxMultiplier) {
        multiplier = cat.maxMultiplier;
      }
      
      const finalPrice = Math.round(cat.basePrice * multiplier);
      const clampedPrice = Math.max(cat.minPrice, Math.min(cat.maxPrice, finalPrice));
      
      return {
        category: cat.name,
        basePrice: cat.basePrice,
        finalPrice: clampedPrice,
        appliedRules,
        multiplier,
      };
    });
  }, [categories, rules, simulationParams]);

  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
      <h3 className="text-white font-semibold mb-4">Pricing Preview</h3>
      
      <div className="space-y-3">
        {previews.map(preview => (
          <div key={preview.category} className="p-3 bg-surface-active rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{preview.category}</span>
              <div className="text-right">
                <span className="text-gray-400 text-sm line-through mr-2">₹{preview.basePrice}</span>
                <span className="text-primary-400 font-bold">₹{preview.finalPrice}</span>
              </div>
            </div>
            {preview.appliedRules.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {preview.appliedRules.map(rule => (
                  <span key={rule} className="px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded text-xs">
                    {rule}
                  </span>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Multiplier: {preview.multiplier.toFixed(2)}x
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'categories' | 'simulator'>('rules');
  const [ruleTypeFilter, setRuleTypeFilter] = useState<string>('all');

  // Simulation parameters
  const [simParams, setSimParams] = useState({
    dayOfWeek: new Date().getDay(),
    time: '18:00',
    occupancy: 50,
    daysBeforeShow: 3,
  });

  // Mock data
  const pricingRules: PricingRule[] = [
    {
      id: 'r1',
      name: 'Base Pricing',
      description: 'Default pricing for all shows',
      type: 'base',
      active: true,
      priority: 1,
      multiplier: 1.0,
      conditions: {},
      effectiveFrom: '2024-01-01',
      effectiveTo: '2025-12-31',
      createdAt: '2024-01-01',
    },
    {
      id: 'r2',
      name: 'Weekend Premium',
      description: 'Higher prices for weekend shows',
      type: 'day_of_week',
      active: true,
      priority: 2,
      multiplier: 1.2,
      conditions: { daysOfWeek: [0, 6] },
      effectiveFrom: '2024-01-01',
      effectiveTo: '2025-12-31',
      createdAt: '2024-01-01',
    },
    {
      id: 'r3',
      name: 'Prime Time',
      description: 'Evening show premium pricing',
      type: 'time_based',
      active: true,
      priority: 3,
      multiplier: 1.15,
      conditions: { startTime: '18:00', endTime: '21:00' },
      effectiveFrom: '2024-01-01',
      effectiveTo: '2025-12-31',
      createdAt: '2024-01-01',
    },
    {
      id: 'r4',
      name: 'High Demand Surge',
      description: 'Price surge when occupancy exceeds 80%',
      type: 'occupancy',
      active: true,
      priority: 4,
      multiplier: 1.25,
      conditions: { occupancyMin: 80, occupancyMax: 100 },
      effectiveFrom: '2024-01-01',
      effectiveTo: '2025-12-31',
      createdAt: '2024-01-01',
    },
    {
      id: 'r5',
      name: 'Early Bird Discount',
      description: 'Discount for bookings 7+ days in advance',
      type: 'early_bird',
      active: true,
      priority: 5,
      multiplier: 0.9,
      conditions: { daysBeforeShow: 7 },
      effectiveFrom: '2024-01-01',
      effectiveTo: '2025-12-31',
      createdAt: '2024-01-01',
    },
    {
      id: 'r6',
      name: 'Midweek Special',
      description: 'Discount for Tuesday and Wednesday shows',
      type: 'day_of_week',
      active: false,
      priority: 6,
      multiplier: 0.85,
      conditions: { daysOfWeek: [2, 3] },
      effectiveFrom: '2024-01-01',
      effectiveTo: '2025-12-31',
      createdAt: '2024-01-01',
    },
  ];

  const seatCategories: SeatCategory[] = [
    { id: 'c1', name: 'Standard', basePrice: 200, minPrice: 150, maxPrice: 350, dynamicPricingEnabled: true, maxMultiplier: 1.5 },
    { id: 'c2', name: 'Premium', basePrice: 350, minPrice: 300, maxPrice: 500, dynamicPricingEnabled: true, maxMultiplier: 1.4 },
    { id: 'c3', name: 'VIP', basePrice: 500, minPrice: 450, maxPrice: 700, dynamicPricingEnabled: true, maxMultiplier: 1.3 },
    { id: 'c4', name: 'Recliner', basePrice: 600, minPrice: 550, maxPrice: 800, dynamicPricingEnabled: true, maxMultiplier: 1.25 },
    { id: 'c5', name: 'Wheelchair', basePrice: 200, minPrice: 200, maxPrice: 200, dynamicPricingEnabled: false, maxMultiplier: 1.0 },
  ];

  const ruleTypes = [
    { id: 'all', name: 'All Rules' },
    { id: 'base', name: 'Base' },
    { id: 'time_based', name: 'Time Based' },
    { id: 'day_of_week', name: 'Day of Week' },
    { id: 'occupancy', name: 'Occupancy' },
    { id: 'early_bird', name: 'Early Bird' },
    { id: 'last_minute', name: 'Last Minute' },
    { id: 'special_event', name: 'Special Event' },
  ];

  const filteredRules = useMemo(() => {
    if (ruleTypeFilter === 'all') return pricingRules;
    return pricingRules.filter(r => r.type === ruleTypeFilter);
  }, [pricingRules, ruleTypeFilter]);

  const activeRulesCount = pricingRules.filter(r => r.active).length;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pricing Engine</h1>
          <p className="text-gray-400">Configure dynamic pricing rules and seat categories</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pricing/history"
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Price History
          </Link>
          <Link
            href="/admin/pricing/create"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Rule
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Total Rules</p>
          <p className="text-2xl font-bold text-white">{pricingRules.length}</p>
        </div>
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Active Rules</p>
          <p className="text-2xl font-bold text-green-400">{activeRulesCount}</p>
        </div>
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Seat Categories</p>
          <p className="text-2xl font-bold text-white">{seatCategories.length}</p>
        </div>
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Dynamic Pricing</p>
          <p className="text-2xl font-bold text-primary-400">
            {seatCategories.filter(c => c.dynamicPricingEnabled).length}/{seatCategories.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-active rounded-lg p-1 w-fit">
        {[
          { id: 'rules', name: 'Pricing Rules' },
          { id: 'categories', name: 'Seat Categories' },
          { id: 'simulator', name: 'Price Simulator' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'text-gray-400 hover:text-white'
            )}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex flex-wrap gap-2">
            {ruleTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setRuleTypeFilter(type.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm transition-colors',
                  ruleTypeFilter === type.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-active text-gray-400 hover:text-white'
                )}
              >
                {type.name}
              </button>
            ))}
          </div>

          {/* Rules Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRules.map(rule => (
              <PricingRuleCard
                key={rule.id}
                rule={rule}
                onEdit={() => console.log('Edit rule:', rule.id)}
                onToggle={() => console.log('Toggle rule:', rule.id)}
                onDelete={() => {
                  if (window.confirm('Delete this pricing rule?')) {
                    console.log('Delete rule:', rule.id);
                  }
                }}
              />
            ))}
          </div>

          {filteredRules.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No pricing rules found for this filter.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-400">Configure base prices and dynamic pricing caps for each seat category.</p>
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
              Add Category
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seatCategories.map(category => (
              <SeatCategoryCard
                key={category.id}
                category={category}
                onEdit={() => console.log('Edit category:', category.id)}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Simulation Controls */}
          <div className="bg-surface-card rounded-xl border border-gray-800 p-4 space-y-4">
            <h3 className="text-white font-semibold">Simulation Parameters</h3>
            <p className="text-gray-400 text-sm">Adjust parameters to see how pricing rules affect final prices.</p>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Day of Week</label>
              <select
                value={simParams.dayOfWeek}
                onChange={(e) => setSimParams(s => ({ ...s, dayOfWeek: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                {dayNames.map((day, index) => (
                  <option key={index} value={index}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Show Time</label>
              <input
                type="time"
                value={simParams.time}
                onChange={(e) => setSimParams(s => ({ ...s, time: e.target.value }))}
                className="w-full px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Current Occupancy: {simParams.occupancy}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={simParams.occupancy}
                onChange={(e) => setSimParams(s => ({ ...s, occupancy: parseInt(e.target.value) }))}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Days Before Show: {simParams.daysBeforeShow}
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={simParams.daysBeforeShow}
                onChange={(e) => setSimParams(s => ({ ...s, daysBeforeShow: parseInt(e.target.value) }))}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Today</span>
                <span>15 days</span>
                <span>30 days</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <PricingPreviewComponent
            categories={seatCategories}
            rules={pricingRules}
            simulationParams={simParams}
          />
        </div>
      )}
    </div>
  );
}
