'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';

type DashboardRange = 'today' | '7d' | '30d';

type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';

interface DashboardResponse {
  range: DashboardRange;
  stats: {
    totalRevenue: number;
    totalBookings: number;
    activeShows: number;
    avgOccupancy: number;
    totalUsers: number;
    totalVenues: number;
    totalEvents: number;
  };
  changes: {
    totalRevenue: number;
    totalBookings: number;
    activeShows: number;
    avgOccupancy: number;
  };
  recentBookings: Array<{
    id: string;
    code: string;
    movieTitle: string;
    venueName: string;
    seats: number;
    totalAmount: number;
    status: BookingStatus;
    createdAt: string;
  }>;
  liveActivity: Array<{
    type: 'booking' | 'cancellation';
    title: string;
    detail: string;
    createdAt: string;
  }>;
  revenueTrend: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  topMovies: Array<{
    eventId: string;
    title: string;
    revenue: number;
    bookings: number;
  }>;
}

const formatCurrency = (value: number) => {
  return `₹${new Intl.NumberFormat('en-IN').format(Math.round(value))}`;
};

const formatPct = (value: number) => {
  const sign = value >= 0 ? '↑' : '↓';
  return `${sign} ${Math.abs(value).toFixed(1)}%`;
};

const relativeTime = (value: string) => {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hrs ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

const statusPill = (status: BookingStatus) => {
  if (status === 'CONFIRMED') return 'bg-green-500/10 text-green-400';
  if (status === 'PENDING') return 'bg-yellow-500/10 text-yellow-400';
  return 'bg-red-500/10 text-red-400';
};

export default function AdminDashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [range, setRange] = useState<DashboardRange>('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<DashboardResponse>(`/admin/dashboard?range=${range}`);
        setData(response);
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [range, isAuthenticated, isLoading]);

  const statCards = useMemo(() => {
    if (!data) return [];
    return [
      {
        title: 'Total Revenue',
        value: formatCurrency(data.stats.totalRevenue),
        change: data.changes.totalRevenue,
        color: 'green',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      {
        title: 'Total Bookings',
        value: new Intl.NumberFormat('en-IN').format(data.stats.totalBookings),
        change: data.changes.totalBookings,
        color: 'primary',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        )
      },
      {
        title: 'Active Shows',
        value: new Intl.NumberFormat('en-IN').format(data.stats.activeShows),
        change: data.changes.activeShows,
        color: 'purple',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        )
      },
      {
        title: 'Avg. Occupancy',
        value: `${data.stats.avgOccupancy.toFixed(1)}%`,
        change: data.changes.avgOccupancy,
        color: 'yellow',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      }
    ];
  }, [data]);

  if (isLoading || loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 bg-surface-active rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 bg-surface-card rounded-xl border border-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
        {error || 'Unable to load dashboard data'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Operational view based on live booking and show data.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as DashboardRange)}
            className="bg-surface-active border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Link
            href="/admin/analytics"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Open Analytics
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const colorClasses: Record<string, string> = {
            primary: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
            green: 'bg-green-500/10 text-green-400 border-green-500/20',
            yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
          };

          return (
            <div key={index} className="bg-surface-card rounded-xl p-6 border border-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 ${stat.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPct(stat.change)} vs previous period
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>{stat.icon}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-card rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Top Movies by Revenue</h2>
            <Link href="/admin/movies" className="text-primary-400 text-sm hover:text-primary-300">Manage Movies →</Link>
          </div>
          <div className="space-y-3">
            {data.topMovies.length === 0 && (
              <p className="text-gray-500 text-sm">No confirmed bookings in selected range.</p>
            )}
            {data.topMovies.map((movie) => (
              <div key={movie.eventId} className="p-3 rounded-lg bg-surface-active border border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{movie.title}</p>
                  <p className="text-gray-500 text-sm">{movie.bookings} bookings</p>
                </div>
                <p className="text-primary-400 font-semibold">{formatCurrency(movie.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-card rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Live Activity</h2>
            <span className="flex items-center gap-2 text-green-400 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <div className="space-y-4">
            {data.liveActivity.length === 0 && (
              <p className="text-gray-500 text-sm">No recent activity.</p>
            )}
            {data.liveActivity.map((item, index) => (
              <div key={`${item.title}-${index}`} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${item.type === 'cancellation' ? 'bg-red-400' : 'bg-primary-400'}`} />
                <div className="flex-1">
                  <p className="text-white text-sm">{item.title}</p>
                  <p className="text-gray-500 text-xs">{item.detail}</p>
                </div>
                <span className="text-gray-500 text-xs">{relativeTime(item.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface-card rounded-xl border border-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Recent Bookings</h2>
          <Link href="/bookings" className="text-primary-400 hover:text-primary-300 text-sm transition-colors">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-active">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Booking</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Movie/Venue</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-400 uppercase">Seats</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-800 last:border-0">
                  <td className="py-4 px-4 text-gray-400 font-mono text-sm">{booking.code}</td>
                  <td className="py-4 px-4">
                    <p className="text-white font-medium">{booking.movieTitle}</p>
                    <p className="text-gray-500 text-sm">{booking.venueName}</p>
                  </td>
                  <td className="py-4 px-4 text-center text-white">{booking.seats}</td>
                  <td className="py-4 px-4 text-white font-medium">{formatCurrency(booking.totalAmount)}</td>
                  <td className="py-4 px-4 text-gray-400 text-sm">{relativeTime(booking.createdAt)}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusPill(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-card rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Revenue Trend</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {data.revenueTrend.length === 0 && <p className="text-gray-500 text-sm">No revenue points for selected range.</p>}
            {data.revenueTrend.map((point) => (
              <div key={point.date} className="flex items-center justify-between p-2 rounded bg-surface-active">
                <span className="text-gray-300 text-sm">{point.date}</span>
                <span className="text-white text-sm">{formatCurrency(point.revenue)} • {point.bookings} bookings</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-card rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">System Snapshot</h2>
          <div className="space-y-3">
            <div className="p-3 rounded bg-surface-active flex items-center justify-between">
              <span className="text-gray-300">Active Users</span>
              <span className="text-white font-semibold">{new Intl.NumberFormat('en-IN').format(data.stats.totalUsers)}</span>
            </div>
            <div className="p-3 rounded bg-surface-active flex items-center justify-between">
              <span className="text-gray-300">Active Venues</span>
              <span className="text-white font-semibold">{new Intl.NumberFormat('en-IN').format(data.stats.totalVenues)}</span>
            </div>
            <div className="p-3 rounded bg-surface-active flex items-center justify-between">
              <span className="text-gray-300">Active Movies/Events</span>
              <span className="text-white font-semibold">{new Intl.NumberFormat('en-IN').format(data.stats.totalEvents)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
