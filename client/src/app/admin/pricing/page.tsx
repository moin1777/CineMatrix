'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';

type RuleType = 'all' | 'base' | 'time_based' | 'occupancy' | 'day_of_week' | 'special_event' | 'early_bird' | 'last_minute';

interface PricingRule {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  active: boolean;
  priority: number;
  multiplier: number;
  conditions: Record<string, any>;
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

interface PricingResponse {
  rules: PricingRule[];
  categories: SeatCategory[];
  summary: {
    totalRules: number;
    activeRules: number;
    totalCategories: number;
    dynamicEnabledCount: number;
  };
}

export default function PricingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [tab, setTab] = useState<'rules' | 'categories' | 'simulator'>('rules');
  const [ruleType, setRuleType] = useState<RuleType>('all');
  const [data, setData] = useState<PricingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [simParams, setSimParams] = useState({
    dayOfWeek: new Date().getDay(),
    time: '18:00',
    occupancy: 50,
    daysBeforeShow: 3
  });

  const loadPricing = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<PricingResponse>(`/admin/pricing?type=${ruleType}`);
      setData(response);
    } catch (err: any) {
      setError(err?.message || 'Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    loadPricing();
  }, [isLoading, isAuthenticated, ruleType]);

  const handleToggle = async (rule: PricingRule) => {
    try {
      await api.patch(`/admin/pricing/rules/${rule.id}/status`, { active: !rule.active });
      await loadPricing();
    } catch (err: any) {
      setError(err?.message || 'Failed to update pricing rule');
    }
  };

  const handleDelete = async (rule: PricingRule) => {
    if (!window.confirm(`Delete pricing rule \"${rule.name}\"?`)) return;

    try {
      await api.delete(`/admin/pricing/rules/${rule.id}`);
      await loadPricing();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete pricing rule');
    }
  };

  const previews = useMemo(() => {
    if (!data) return [];

    return data.categories.map((category) => {
      let multiplier = 1;
      const appliedRules: string[] = [];

      const activeRules = data.rules.filter((rule) => rule.active).sort((a, b) => a.priority - b.priority);
      for (const rule of activeRules) {
        let applies = true;

        if (rule.conditions.daysOfWeek && !rule.conditions.daysOfWeek.includes(simParams.dayOfWeek)) {
          applies = false;
        }

        if (rule.conditions.startTime && rule.conditions.endTime) {
          if (simParams.time < rule.conditions.startTime || simParams.time > rule.conditions.endTime) {
            applies = false;
          }
        }

        if (typeof rule.conditions.occupancyMin === 'number' && typeof rule.conditions.occupancyMax === 'number') {
          if (simParams.occupancy < rule.conditions.occupancyMin || simParams.occupancy > rule.conditions.occupancyMax) {
            applies = false;
          }
        }

        if (typeof rule.conditions.daysBeforeShow === 'number' && simParams.daysBeforeShow < rule.conditions.daysBeforeShow) {
          applies = false;
        }

        if (applies) {
          multiplier *= rule.multiplier;
          appliedRules.push(rule.name);
        }
      }

      if (category.dynamicPricingEnabled) {
        multiplier = Math.min(multiplier, category.maxMultiplier);
      }

      const rawPrice = Math.round(category.basePrice * multiplier);
      const finalPrice = Math.max(category.minPrice, Math.min(category.maxPrice, rawPrice));

      return {
        category: category.name,
        basePrice: category.basePrice,
        finalPrice,
        multiplier,
        appliedRules
      };
    });
  }, [data, simParams]);

  if (isLoading || loading) {
    return <div className="h-40 bg-surface-card rounded-xl border border-gray-800 animate-pulse" />;
  }

  if (error && !data) {
    return <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pricing Engine</h1>
          <p className="text-gray-400">Manage live pricing rules and seat category boundaries.</p>
        </div>
        <button onClick={loadPricing} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          Refresh
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4"><p className="text-gray-400 text-sm">Total Rules</p><p className="text-2xl font-bold text-white">{data?.summary.totalRules || 0}</p></div>
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4"><p className="text-gray-400 text-sm">Active Rules</p><p className="text-2xl font-bold text-green-400">{data?.summary.activeRules || 0}</p></div>
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4"><p className="text-gray-400 text-sm">Seat Categories</p><p className="text-2xl font-bold text-white">{data?.summary.totalCategories || 0}</p></div>
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4"><p className="text-gray-400 text-sm">Dynamic Pricing</p><p className="text-2xl font-bold text-primary-400">{data?.summary.dynamicEnabledCount || 0}/{data?.summary.totalCategories || 0}</p></div>
      </div>

      <div className="flex bg-surface-active rounded-lg p-1 w-fit">
        {[
          { id: 'rules', name: 'Pricing Rules' },
          { id: 'categories', name: 'Seat Categories' },
          { id: 'simulator', name: 'Price Simulator' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id as typeof tab)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === item.id ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white')}
          >
            {item.name}
          </button>
        ))}
      </div>

      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', name: 'All Rules' },
              { id: 'base', name: 'Base' },
              { id: 'time_based', name: 'Time Based' },
              { id: 'day_of_week', name: 'Day of Week' },
              { id: 'occupancy', name: 'Occupancy' },
              { id: 'early_bird', name: 'Early Bird' },
              { id: 'last_minute', name: 'Last Minute' },
              { id: 'special_event', name: 'Special Event' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setRuleType(item.id as RuleType)}
                className={cn('px-3 py-1.5 rounded-lg text-sm transition-colors', ruleType === item.id ? 'bg-primary-500 text-white' : 'bg-surface-active text-gray-400 hover:text-white')}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(data?.rules || []).map((rule) => (
              <div key={rule.id} className={cn('bg-surface-card rounded-xl border overflow-hidden', rule.active ? 'border-gray-800' : 'border-gray-800/50 opacity-70')}>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-white">{rule.name}</h3>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', rule.multiplier >= 1 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                      {rule.multiplier >= 1 ? '+' : ''}{((rule.multiplier - 1) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{rule.description || 'No description'}</p>
                  <p className="text-xs text-gray-500 mt-2">Priority: {rule.priority} • Type: {rule.type}</p>
                </div>
                <div className="flex border-t border-gray-800">
                  <button onClick={() => handleToggle(rule)} className={cn('flex-1 py-2.5 text-sm transition-colors', rule.active ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-400 hover:bg-surface-active')}>
                    {rule.active ? 'Active' : 'Inactive'}
                  </button>
                  <div className="border-l border-gray-800" />
                  <button onClick={() => handleDelete(rule)} className="flex-1 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.categories || []).map((category) => (
            <div key={category.id} className="bg-surface-card rounded-xl border border-gray-800 p-4">
              <h3 className="font-semibold text-white">{category.name}</h3>
              <div className="space-y-2 text-sm mt-3">
                <div className="flex justify-between"><span className="text-gray-400">Base Price</span><span className="text-white">₹{category.basePrice}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Range</span><span className="text-gray-300">₹{category.minPrice} - ₹{category.maxPrice}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Dynamic</span><span className={category.dynamicPricingEnabled ? 'text-green-400' : 'text-gray-500'}>{category.dynamicPricingEnabled ? 'Enabled' : 'Disabled'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Max Multiplier</span><span className="text-primary-400">{category.maxMultiplier}x</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-card rounded-xl border border-gray-800 p-4 space-y-4">
            <h3 className="text-white font-semibold">Simulation Parameters</h3>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Day of Week</label>
              <select value={simParams.dayOfWeek} onChange={(e) => setSimParams((prev) => ({ ...prev, dayOfWeek: parseInt(e.target.value, 10) }))} className="w-full px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                  <option key={day} value={index}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Show Time</label>
              <input type="time" value={simParams.time} onChange={(e) => setSimParams((prev) => ({ ...prev, time: e.target.value }))} className="w-full px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white" />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Occupancy: {simParams.occupancy}%</label>
              <input type="range" min="0" max="100" value={simParams.occupancy} onChange={(e) => setSimParams((prev) => ({ ...prev, occupancy: parseInt(e.target.value, 10) }))} className="w-full accent-primary-500" />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Days Before Show: {simParams.daysBeforeShow}</label>
              <input type="range" min="0" max="30" value={simParams.daysBeforeShow} onChange={(e) => setSimParams((prev) => ({ ...prev, daysBeforeShow: parseInt(e.target.value, 10) }))} className="w-full accent-primary-500" />
            </div>
          </div>

          <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
            <h3 className="text-white font-semibold mb-4">Pricing Preview</h3>
            <div className="space-y-3">
              {previews.map((item) => (
                <div key={item.category} className="p-3 bg-surface-active rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{item.category}</span>
                    <div>
                      <span className="text-gray-500 line-through mr-2">₹{item.basePrice}</span>
                      <span className="text-primary-400 font-semibold">₹{item.finalPrice}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Multiplier: {item.multiplier.toFixed(2)}x</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
