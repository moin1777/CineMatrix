'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
  avgTicketPrice: number;
}

interface OccupancyData {
  screen: string;
  venue: string;
  time: string;
  occupancy: number;
}

interface TopMovie {
  id: string;
  title: string;
  revenue: number;
  bookings: number;
  avgOccupancy: number;
  trend: 'up' | 'down' | 'stable';
}

interface TopVenue {
  id: string;
  name: string;
  revenue: number;
  bookings: number;
  screens: number;
  avgOccupancy: number;
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: JSX.Element;
  trend?: 'up' | 'down';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeLabel, icon, trend }) => {
  const isPositive = trend === 'up' || (trend === undefined && change >= 0);

  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-sm">{title}</span>
        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      <div className="flex items-center gap-2">
        <span className={cn(
          'flex items-center text-sm font-medium',
          isPositive ? 'text-green-400' : 'text-red-400'
        )}>
          {isPositive ? (
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : (
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          {Math.abs(change)}%
        </span>
        <span className="text-gray-500 text-sm">{changeLabel}</span>
      </div>
    </div>
  );
};

// ============================================================================
// CHART PLACEHOLDER COMPONENT
// ============================================================================

interface ChartPlaceholderProps {
  title: string;
  subtitle?: string;
  height?: string;
  data?: { label: string; value: number; color?: string }[];
  type?: 'bar' | 'line' | 'area';
}

const ChartPlaceholder: React.FC<ChartPlaceholderProps> = ({ 
  title, 
  subtitle, 
  height = 'h-64',
  data,
  type = 'bar'
}) => {
  const maxValue = data ? Math.max(...data.map(d => d.value)) : 0;

  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
      <div className="mb-4">
        <h3 className="text-white font-semibold">{title}</h3>
        {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
      </div>
      
      {data ? (
        <div className={cn(height, 'flex items-end gap-2')}>
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={cn(
                  'w-full rounded-t-lg transition-all',
                  item.color || 'bg-primary-500'
                )}
                style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: '4px' }}
              />
              <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn(height, 'flex items-center justify-center text-gray-600')}>
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">Chart visualization</p>
            <p className="text-xs text-gray-700">Integrate with charting library</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// OCCUPANCY HEATMAP COMPONENT
// ============================================================================

interface OccupancyHeatmapProps {
  data: OccupancyData[];
}

const OccupancyHeatmap: React.FC<OccupancyHeatmapProps> = ({ data }) => {
  const times = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
  const screens = useMemo(() => Array.from(new Set(data.map(d => d.screen))), [data]);

  const getOccupancy = (screen: string, time: string) => {
    const item = data.find(d => d.screen === screen && d.time === time);
    return item?.occupancy || 0;
  };

  const getColor = (occupancy: number) => {
    if (occupancy >= 90) return 'bg-green-500';
    if (occupancy >= 70) return 'bg-green-400';
    if (occupancy >= 50) return 'bg-yellow-500';
    if (occupancy >= 30) return 'bg-orange-500';
    if (occupancy > 0) return 'bg-red-500';
    return 'bg-gray-700';
  };

  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
      <h3 className="text-white font-semibold mb-4">Occupancy Heatmap</h3>
      
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Time headers */}
          <div className="flex mb-2">
            <div className="w-24 flex-shrink-0" />
            {times.map(time => (
              <div key={time} className="flex-1 text-center text-xs text-gray-500">
                {time}
              </div>
            ))}
          </div>

          {/* Rows */}
          {screens.map(screen => (
            <div key={screen} className="flex mb-2">
              <div className="w-24 flex-shrink-0 text-sm text-gray-400 pr-2 truncate">
                {screen}
              </div>
              {times.map(time => {
                const occupancy = getOccupancy(screen, time);
                return (
                  <div
                    key={time}
                    className="flex-1 px-0.5"
                    title={`${screen} at ${time}: ${occupancy}%`}
                  >
                    <div
                      className={cn(
                        'h-8 rounded flex items-center justify-center text-xs text-white font-medium transition-colors',
                        getColor(occupancy)
                      )}
                    >
                      {occupancy > 0 ? `${occupancy}%` : '–'}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-gray-700" />
              <span className="text-gray-500">No data</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-red-500" />
              <span className="text-gray-500">{'<30%'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-orange-500" />
              <span className="text-gray-500">30-50%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-yellow-500" />
              <span className="text-gray-500">50-70%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-green-400" />
              <span className="text-gray-500">70-90%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-green-500" />
              <span className="text-gray-500">{'>90%'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TOP PERFORMERS TABLE
// ============================================================================

interface TopMoviesTableProps {
  movies: TopMovie[];
}

const TopMoviesTable: React.FC<TopMoviesTableProps> = ({ movies }) => {
  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-white font-semibold">Top Performing Movies</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Movie</th>
              <th className="text-right py-3 px-4 text-gray-400 text-sm font-medium">Revenue</th>
              <th className="text-right py-3 px-4 text-gray-400 text-sm font-medium">Bookings</th>
              <th className="text-right py-3 px-4 text-gray-400 text-sm font-medium">Avg. Occupancy</th>
              <th className="text-center py-3 px-4 text-gray-400 text-sm font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie, index) => (
              <tr key={movie.id} className="border-b border-gray-800 last:border-0 hover:bg-surface-active">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span className="text-white font-medium">{movie.title}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-white">₹{movie.revenue.toLocaleString()}</td>
                <td className="py-3 px-4 text-right text-gray-300">{movie.bookings.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">
                  <span className={cn(
                    movie.avgOccupancy >= 70 ? 'text-green-400' :
                    movie.avgOccupancy >= 50 ? 'text-yellow-400' : 'text-red-400'
                  )}>
                    {movie.avgOccupancy}%
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {movie.trend === 'up' && (
                    <span className="text-green-400">↑</span>
                  )}
                  {movie.trend === 'down' && (
                    <span className="text-red-400">↓</span>
                  )}
                  {movie.trend === 'stable' && (
                    <span className="text-gray-400">→</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// TOP VENUES TABLE
// ============================================================================

interface TopVenuesTableProps {
  venues: TopVenue[];
}

const TopVenuesTable: React.FC<TopVenuesTableProps> = ({ venues }) => {
  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-white font-semibold">Venue Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Venue</th>
              <th className="text-center py-3 px-4 text-gray-400 text-sm font-medium">Screens</th>
              <th className="text-right py-3 px-4 text-gray-400 text-sm font-medium">Revenue</th>
              <th className="text-right py-3 px-4 text-gray-400 text-sm font-medium">Bookings</th>
              <th className="text-right py-3 px-4 text-gray-400 text-sm font-medium">Avg. Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {venues.map(venue => (
              <tr key={venue.id} className="border-b border-gray-800 last:border-0 hover:bg-surface-active">
                <td className="py-3 px-4">
                  <span className="text-white font-medium">{venue.name}</span>
                </td>
                <td className="py-3 px-4 text-center text-gray-300">{venue.screens}</td>
                <td className="py-3 px-4 text-right text-white">₹{venue.revenue.toLocaleString()}</td>
                <td className="py-3 px-4 text-right text-gray-300">{venue.bookings.toLocaleString()}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          venue.avgOccupancy >= 70 ? 'bg-green-500' :
                          venue.avgOccupancy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        )}
                        style={{ width: `${venue.avgOccupancy}%` }}
                      />
                    </div>
                    <span className="text-gray-300 text-sm w-10 text-right">{venue.avgOccupancy}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('7d');
  const [venueFilter, setVenueFilter] = useState('all');

  // Mock data
  const occupancyData: OccupancyData[] = [
    { screen: 'Screen 1 (IMAX)', venue: 'PVR', time: '06:00', occupancy: 25 },
    { screen: 'Screen 1 (IMAX)', venue: 'PVR', time: '09:00', occupancy: 45 },
    { screen: 'Screen 1 (IMAX)', venue: 'PVR', time: '12:00', occupancy: 65 },
    { screen: 'Screen 1 (IMAX)', venue: 'PVR', time: '15:00', occupancy: 75 },
    { screen: 'Screen 1 (IMAX)', venue: 'PVR', time: '18:00', occupancy: 92 },
    { screen: 'Screen 1 (IMAX)', venue: 'PVR', time: '21:00', occupancy: 88 },
    { screen: 'Screen 2', venue: 'PVR', time: '06:00', occupancy: 15 },
    { screen: 'Screen 2', venue: 'PVR', time: '09:00', occupancy: 35 },
    { screen: 'Screen 2', venue: 'PVR', time: '12:00', occupancy: 55 },
    { screen: 'Screen 2', venue: 'PVR', time: '15:00', occupancy: 60 },
    { screen: 'Screen 2', venue: 'PVR', time: '18:00', occupancy: 82 },
    { screen: 'Screen 2', venue: 'PVR', time: '21:00', occupancy: 78 },
    { screen: 'Screen 3', venue: 'PVR', time: '06:00', occupancy: 0 },
    { screen: 'Screen 3', venue: 'PVR', time: '09:00', occupancy: 28 },
    { screen: 'Screen 3', venue: 'PVR', time: '12:00', occupancy: 42 },
    { screen: 'Screen 3', venue: 'PVR', time: '15:00', occupancy: 55 },
    { screen: 'Screen 3', venue: 'PVR', time: '18:00', occupancy: 70 },
    { screen: 'Screen 3', venue: 'PVR', time: '21:00', occupancy: 65 },
  ];

  const topMovies: TopMovie[] = [
    { id: '1', title: 'Pushpa 2: The Rule', revenue: 4500000, bookings: 15000, avgOccupancy: 92, trend: 'up' },
    { id: '2', title: 'KGF Chapter 3', revenue: 3200000, bookings: 12000, avgOccupancy: 85, trend: 'up' },
    { id: '3', title: 'Avatar 3', revenue: 2800000, bookings: 9500, avgOccupancy: 78, trend: 'stable' },
    { id: '4', title: 'RRR 2', revenue: 2100000, bookings: 7800, avgOccupancy: 72, trend: 'down' },
    { id: '5', title: 'Inception 2', revenue: 1800000, bookings: 6200, avgOccupancy: 68, trend: 'stable' },
  ];

  const topVenues: TopVenue[] = [
    { id: '1', name: 'PVR Cinemas - Forum Mall', revenue: 5200000, bookings: 18000, screens: 5, avgOccupancy: 78 },
    { id: '2', name: 'INOX Multiplex - City Centre', revenue: 4100000, bookings: 14500, screens: 4, avgOccupancy: 72 },
    { id: '3', name: 'Cinepolis - Phoenix Mall', revenue: 3500000, bookings: 12000, screens: 6, avgOccupancy: 65 },
    { id: '4', name: 'PVR Gold - Select City', revenue: 2800000, bookings: 8500, screens: 3, avgOccupancy: 82 },
  ];

  const revenueByDay = [
    { label: 'Mon', value: 450000, color: 'bg-primary-500' },
    { label: 'Tue', value: 320000, color: 'bg-primary-500' },
    { label: 'Wed', value: 380000, color: 'bg-primary-500' },
    { label: 'Thu', value: 420000, color: 'bg-primary-500' },
    { label: 'Fri', value: 680000, color: 'bg-green-500' },
    { label: 'Sat', value: 920000, color: 'bg-green-500' },
    { label: 'Sun', value: 850000, color: 'bg-green-500' },
  ];

  const bookingsByCategory = [
    { label: 'Standard', value: 45, color: 'bg-blue-500' },
    { label: 'Premium', value: 28, color: 'bg-purple-500' },
    { label: 'VIP', value: 15, color: 'bg-yellow-500' },
    { label: 'Recliner', value: 12, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400">Track revenue, occupancy, and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
            className="px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
          >
            <option value="all">All Venues</option>
            <option value="pvr">PVR Cinemas</option>
            <option value="inox">INOX Multiplex</option>
          </select>
          <div className="flex bg-surface-active rounded-lg p-1">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  dateRange === range.id
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value="₹42.5L"
          change={12.5}
          changeLabel="vs last week"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Total Bookings"
          value="12,847"
          change={8.3}
          changeLabel="vs last week"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          }
        />
        <StatCard
          title="Avg. Occupancy"
          value="74.2%"
          change={5.2}
          changeLabel="vs last week"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          title="Active Shows"
          value="156"
          change={-2.1}
          changeLabel="vs last week"
          trend="down"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPlaceholder
          title="Revenue by Day"
          subtitle="Last 7 days"
          data={revenueByDay}
          height="h-48"
        />
        <ChartPlaceholder
          title="Bookings by Seat Category"
          subtitle="Distribution of seat selections"
          data={bookingsByCategory}
          height="h-48"
        />
      </div>

      {/* Occupancy Heatmap */}
      <OccupancyHeatmap data={occupancyData} />

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopMoviesTable movies={topMovies} />
        <TopVenuesTable venues={topVenues} />
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Peak Hours</h3>
            <span className="text-primary-400 text-sm">Today</span>
          </div>
          <div className="space-y-3">
            {[
              { time: '6:00 PM - 9:00 PM', percentage: 92 },
              { time: '9:00 PM - 12:00 AM', percentage: 85 },
              { time: '3:00 PM - 6:00 PM', percentage: 68 },
            ].map((peak, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{peak.time}</span>
                  <span className="text-white">{peak.percentage}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${peak.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Booking Channels</h3>
            <span className="text-primary-400 text-sm">This Week</span>
          </div>
          <div className="space-y-3">
            {[
              { channel: 'Website', percentage: 45, color: 'bg-blue-500' },
              { channel: 'Mobile App', percentage: 35, color: 'bg-green-500' },
              { channel: 'Box Office', percentage: 15, color: 'bg-yellow-500' },
              { channel: 'Partners', percentage: 5, color: 'bg-purple-500' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-gray-400 text-sm flex-1">{item.channel}</span>
                <span className="text-white text-sm font-medium">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Quick Insights</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-2 bg-green-500/10 rounded-lg">
              <span className="text-green-400 mt-0.5">↑</span>
              <p className="text-sm text-green-300">Weekend bookings up 23% compared to last month</p>
            </div>
            <div className="flex items-start gap-3 p-2 bg-yellow-500/10 rounded-lg">
              <span className="text-yellow-400 mt-0.5">!</span>
              <p className="text-sm text-yellow-300">Screen 3 underperforming - consider show optimization</p>
            </div>
            <div className="flex items-start gap-3 p-2 bg-blue-500/10 rounded-lg">
              <span className="text-blue-400 mt-0.5">i</span>
              <p className="text-sm text-blue-300">Premium seats have 15% higher demand than last week</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
