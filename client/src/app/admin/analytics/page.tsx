'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';

type AnalyticsRange = '7d' | '30d' | '90d';

interface AnalyticsResponse {
  stats: {
    totalRevenue: number;
    totalBookings: number;
    avgOccupancy: number;
    activeShows: number;
  };
  filters: {
    venueId: string;
    venues: Array<{ id: string; name: string }>;
  };
  charts: {
    revenueByDay: Array<{ label: string; value: number }>;
    bookingsByCategory: Array<{ label: string; value: number }>;
  };
  occupancyHeatmap: Array<{ screen: string; venue: string; time: string; occupancy: number }>;
  topMovies: Array<{ id: string; title: string; revenue: number; bookings: number; avgOccupancy: number; trend: 'up' | 'down' | 'stable' }>;
  topVenues: Array<{ id: string; name: string; revenue: number; bookings: number; screens: number; avgOccupancy: number }>;
  peakHours: Array<{ time: string; percentage: number }>;
  bookingChannels: Array<{ channel: string; percentage: number }>;
  insights: string[];
}

const StatCard = ({ title, value, subtitle }: { title: string; value: string; subtitle: string }) => (
  <div className="bg-surface-card rounded-xl border border-gray-800 p-5">
    <p className="text-gray-400 text-sm">{title}</p>
    <p className="text-3xl font-bold text-white mt-2">{value}</p>
    <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
  </div>
);

const BarChart = ({ title, data }: { title: string; data: Array<{ label: string; value: number }> }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <div className="h-48 flex items-end gap-2">
        {data.length === 0 && <p className="text-gray-500 text-sm">No data in selected range.</p>}
        {data.map((item) => (
          <div key={item.label} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-primary-500 rounded-t" style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: '4px' }} />
            <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [range, setRange] = useState<AnalyticsRange>('7d');
  const [venueId, setVenueId] = useState('all');
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<AnalyticsResponse>(`/admin/analytics?range=${range}&venueId=${venueId}`);
        setData(response);
      } catch (err: any) {
        setError(err?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [range, venueId, isAuthenticated, isLoading]);

  const occupancyRows = useMemo(() => data?.occupancyHeatmap.slice(0, 18) || [], [data]);

  if (isLoading || loading) {
    return <div className="h-40 bg-surface-card rounded-xl border border-gray-800 animate-pulse" />;
  }

  if (error || !data) {
    return <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">{error || 'No analytics data available.'}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400">Live operational analytics from bookings and show occupancy.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={venueId}
            onChange={(event) => setVenueId(event.target.value)}
            className="px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white"
          >
            <option value="all">All Venues</option>
            {data.filters.venues.map((venue) => (
              <option key={venue.id} value={venue.id}>{venue.name}</option>
            ))}
          </select>
          <div className="flex bg-surface-active rounded-lg p-1">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setRange(item.id as AnalyticsRange)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  range === item.id ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`₹${Math.round(data.stats.totalRevenue).toLocaleString('en-IN')}`} subtitle="Confirmed bookings" />
        <StatCard title="Total Bookings" value={data.stats.totalBookings.toLocaleString('en-IN')} subtitle="In selected range" />
        <StatCard title="Avg. Occupancy" value={`${data.stats.avgOccupancy}%`} subtitle="Across scheduled screens" />
        <StatCard title="Active Shows" value={data.stats.activeShows.toLocaleString('en-IN')} subtitle="Mapped to heatmap" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart title="Revenue by Day" data={data.charts.revenueByDay} />
        <BarChart title="Bookings by Category" data={data.charts.bookingsByCategory} />
      </div>

      <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
        <h3 className="text-white font-semibold mb-4">Occupancy Heatmap</h3>
        <div className="space-y-2">
          {occupancyRows.length === 0 && <p className="text-gray-500 text-sm">No occupancy snapshots for this range.</p>}
          {occupancyRows.map((row) => (
            <div key={`${row.screen}-${row.time}`} className="flex items-center justify-between p-2 bg-surface-active rounded text-sm">
              <span className="text-gray-300">{row.venue} • {row.screen} • {row.time}</span>
              <span className={cn(row.occupancy >= 75 ? 'text-green-400' : row.occupancy >= 50 ? 'text-yellow-400' : 'text-red-400')}>
                {row.occupancy}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <h3 className="text-white font-semibold mb-4">Top Performing Movies</h3>
          <div className="space-y-2">
            {data.topMovies.map((movie) => (
              <div key={movie.id} className="p-2 bg-surface-active rounded flex justify-between items-center text-sm">
                <span className="text-gray-200">{movie.title}</span>
                <span className="text-primary-400">₹{Math.round(movie.revenue).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <h3 className="text-white font-semibold mb-4">Venue Performance</h3>
          <div className="space-y-2">
            {data.topVenues.map((venue) => (
              <div key={venue.id} className="p-2 bg-surface-active rounded flex justify-between items-center text-sm">
                <span className="text-gray-200">{venue.name}</span>
                <span className="text-primary-400">₹{Math.round(venue.revenue).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <h3 className="text-white font-semibold mb-3">Peak Hours</h3>
          <div className="space-y-2">
            {data.peakHours.map((item) => (
              <div key={item.time} className="flex justify-between text-sm">
                <span className="text-gray-400">{item.time}</span>
                <span className="text-white">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <h3 className="text-white font-semibold mb-3">Booking Mix</h3>
          <div className="space-y-2">
            {data.bookingChannels.map((item) => (
              <div key={item.channel} className="flex justify-between text-sm">
                <span className="text-gray-400">{item.channel}</span>
                <span className="text-white">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <h3 className="text-white font-semibold mb-3">Quick Insights</h3>
          <div className="space-y-2">
            {data.insights.map((insight, index) => (
              <p key={index} className="text-sm text-gray-300">• {insight}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
