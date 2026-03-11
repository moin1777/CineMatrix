'use client';

import React from 'react';
import Link from 'next/link';

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  color: 'primary' | 'green' | 'yellow' | 'red' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color }) => {
  const colorClasses = {
    primary: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className="bg-surface-card rounded-xl p-6 border border-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}% vs last week
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// QUICK ACTION BUTTON
// ============================================================================

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, description, href, icon }) => {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 bg-surface-card rounded-xl border border-gray-800 hover:border-primary-500/50 transition-colors group"
    >
      <div className="p-3 bg-primary-500/10 rounded-lg text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  );
};

// ============================================================================
// RECENT BOOKING ROW
// ============================================================================

interface RecentBookingProps {
  id: string;
  movie: string;
  venue: string;
  seats: number;
  amount: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

const RecentBookingRow: React.FC<RecentBookingProps> = ({
  id,
  movie,
  venue,
  seats,
  amount,
  time,
  status,
}) => {
  const statusColors = {
    confirmed: 'bg-green-500/10 text-green-400',
    pending: 'bg-yellow-500/10 text-yellow-400',
    cancelled: 'bg-red-500/10 text-red-400',
  };

  return (
    <tr className="border-b border-gray-800 last:border-0">
      <td className="py-4 px-4">
        <span className="text-gray-400 font-mono text-sm">{id}</span>
      </td>
      <td className="py-4 px-4">
        <div>
          <p className="text-white font-medium">{movie}</p>
          <p className="text-gray-500 text-sm">{venue}</p>
        </div>
      </td>
      <td className="py-4 px-4 text-center">
        <span className="text-white">{seats}</span>
      </td>
      <td className="py-4 px-4">
        <span className="text-white font-medium">{amount}</span>
      </td>
      <td className="py-4 px-4">
        <span className="text-gray-400 text-sm">{time}</span>
      </td>
      <td className="py-4 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </td>
    </tr>
  );
};

// ============================================================================
// MAIN DASHBOARD PAGE
// ============================================================================

export default function AdminDashboardPage() {
  // Mock data for demonstration
  const stats = [
    {
      title: 'Total Revenue',
      value: '₹12,45,678',
      change: { value: 12.5, isPositive: true },
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'green' as const,
    },
    {
      title: 'Total Bookings',
      value: '2,847',
      change: { value: 8.2, isPositive: true },
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      color: 'primary' as const,
    },
    {
      title: 'Active Shows',
      value: '48',
      change: { value: 5.0, isPositive: true },
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      ),
      color: 'purple' as const,
    },
    {
      title: 'Avg. Occupancy',
      value: '78%',
      change: { value: 3.1, isPositive: false },
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'yellow' as const,
    },
  ];

  const quickActions = [
    {
      title: 'Schedule New Show',
      description: 'Add a new movie or event show',
      href: '/admin/shows/create',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    {
      title: 'Box Office',
      description: 'Process offline bookings',
      href: '/admin/box-office',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
    {
      title: 'View Analytics',
      description: 'Revenue & occupancy reports',
      href: '/admin/analytics',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: 'Manage Venues',
      description: 'Edit seats & layouts',
      href: '/admin/venues',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  const recentBookings: RecentBookingProps[] = [
    {
      id: 'BK-7821',
      movie: 'Pushpa 2',
      venue: 'PVR Cinemas, Hyderabad',
      seats: 4,
      amount: '₹1,200',
      time: '2 mins ago',
      status: 'confirmed',
    },
    {
      id: 'BK-7820',
      movie: 'Avatar 3',
      venue: 'INOX Multiplex, Mumbai',
      seats: 2,
      amount: '₹800',
      time: '5 mins ago',
      status: 'confirmed',
    },
    {
      id: 'BK-7819',
      movie: 'KGF Chapter 3',
      venue: 'Cinepolis, Bangalore',
      seats: 6,
      amount: '₹1,800',
      time: '12 mins ago',
      status: 'pending',
    },
    {
      id: 'BK-7818',
      movie: 'RRR 2',
      venue: 'PVR IMAX, Chennai',
      seats: 3,
      amount: '₹1,500',
      time: '18 mins ago',
      status: 'confirmed',
    },
    {
      id: 'BK-7817',
      movie: 'Pathaan 2',
      venue: 'Fun Cinemas, Delhi',
      seats: 2,
      amount: '₹600',
      time: '25 mins ago',
      status: 'cancelled',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-surface-active border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-primary-500">
            <option>Today</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Month</option>
          </select>
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            Download Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-surface-card rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-surface-card rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Live Activity</h2>
            <span className="flex items-center gap-2 text-green-400 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <div className="space-y-4">
            {[
              { event: 'New booking', detail: 'Pushpa 2 - 4 seats', time: 'Just now' },
              { event: 'Show started', detail: 'Avatar 3 @ Screen 2', time: '2 mins ago' },
              { event: 'Sold out', detail: 'KGF 3 - 7:00 PM show', time: '5 mins ago' },
              { event: 'New booking', detail: 'RRR 2 - 2 seats', time: '8 mins ago' },
              { event: 'Cancellation', detail: 'BK-7817 refunded', time: '10 mins ago' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary-400 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-white text-sm">{item.event}</p>
                  <p className="text-gray-500 text-xs">{item.detail}</p>
                </div>
                <span className="text-gray-500 text-xs">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-surface-card rounded-xl border border-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Recent Bookings</h2>
          <Link
            href="/admin/bookings"
            className="text-primary-400 hover:text-primary-300 text-sm transition-colors"
          >
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-active">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Booking ID</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Movie/Venue</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-400 uppercase">Seats</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <RecentBookingRow key={booking.id} {...booking} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Section (Placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-surface-card rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Revenue Trend</h2>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Chart component placeholder - integrate with Chart.js or Recharts</p>
          </div>
        </div>

        {/* Occupancy Heatmap */}
        <div className="bg-surface-card rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Occupancy by Time Slot</h2>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Heatmap component placeholder - integrate with D3.js or custom canvas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
