'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';

type ShowStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

interface ShowItem {
  id: string;
  movieTitle: string;
  moviePoster: string;
  venue: string;
  venueId: string;
  screen: string;
  date: string;
  time: string;
  endTimeLabel: string;
  duration: number;
  bookedSeats: number;
  totalSeats: number;
  revenue: number;
  status: ShowStatus;
}

interface ShowsResponse {
  items: ShowItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { total: number; active: number; totalRevenue: number; avgOccupancy: number };
  filters: { venues: Array<{ id: string; name: string }>; screens: string[] };
}

export default function ShowsPage() {
  const { isAuthenticated, isLoading } = useAuth();

  const [status, setStatus] = useState<'all' | ShowStatus>('all');
  const [venue, setVenue] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ShowsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const from = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }, []);

  const to = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }, []);

  const loadShows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ShowsResponse>(
        `/admin/shows?page=${page}&limit=18&status=${status}&venue=${venue}&search=${encodeURIComponent(search)}&from=${from}&to=${to}`
      );
      setData(response);
    } catch (err: any) {
      setError(err?.message || 'Failed to load shows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    loadShows();
  }, [isLoading, isAuthenticated, page, status, venue]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    loadShows();
  };

  const handleCancel = async (showId: string) => {
    if (!window.confirm('Cancel this show and mark active bookings as cancelled?')) return;

    try {
      await api.patch(`/admin/shows/${showId}/cancel`, { reason: 'Cancelled by admin from schedule panel' });
      await loadShows();
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel show');
    }
  };

  const statusColor = (value: ShowStatus) => {
    if (value === 'scheduled') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (value === 'ongoing') return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (value === 'completed') return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  };

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
          <h1 className="text-2xl font-bold text-white">Shows & Scheduling</h1>
          <p className="text-gray-400">Live schedule from database shows within the selected range.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/shows/calendar" className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">Full Calendar</Link>
          <Link href="/admin/shows/create" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">Schedule Show</Link>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4"><p className="text-gray-400 text-sm">Total Shows</p><p className="text-2xl font-bold text-white">{data?.summary.total || 0}</p></div>
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4"><p className="text-gray-400 text-sm">Active Shows</p><p className="text-2xl font-bold text-green-400">{data?.summary.active || 0}</p></div>
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4"><p className="text-gray-400 text-sm">Revenue</p><p className="text-2xl font-bold text-white">₹{Math.round(data?.summary.totalRevenue || 0).toLocaleString('en-IN')}</p></div>
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4"><p className="text-gray-400 text-sm">Avg Occupancy</p><p className="text-2xl font-bold text-primary-400">{data?.summary.avgOccupancy || 0}%</p></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by movie title"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white placeholder-gray-500"
          />
        </form>

        <select value={status} onChange={(event) => { setStatus(event.target.value as 'all' | ShowStatus); setPage(1); }} className="px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white">
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select value={venue} onChange={(event) => { setVenue(event.target.value); setPage(1); }} className="px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white">
          <option value="all">All Venues</option>
          {(data?.filters.venues || []).map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>

        <button onClick={loadShows} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(data?.items || []).map((show) => {
          const occupancyPercent = show.totalSeats > 0 ? Math.round((show.bookedSeats / show.totalSeats) * 100) : 0;

          return (
            <div key={show.id} className="bg-surface-card rounded-xl border border-gray-800 overflow-hidden hover:border-primary-500/30 transition-colors">
              <div className="flex gap-4 p-4">
                <div className="w-20 h-28 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                  {show.moviePoster ? <img src={show.moviePoster} alt={show.movieTitle} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No poster</div>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white truncate">{show.movieTitle}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColor(show.status)}`}>{show.status}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-gray-400">
                    <p>{show.venue} • {show.screen}</p>
                    <p>{show.date} • {show.time} - {show.endTimeLabel}</p>
                    <p className="text-xs text-gray-500">Duration: {Math.floor(show.duration / 60)}h {show.duration % 60}m</p>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">{show.bookedSeats}/{show.totalSeats} seats</span>
                      <span className={cn(occupancyPercent >= 80 ? 'text-green-400' : occupancyPercent >= 50 ? 'text-yellow-400' : 'text-gray-400')}>
                        {occupancyPercent}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', occupancyPercent >= 80 ? 'bg-green-500' : occupancyPercent >= 50 ? 'bg-yellow-500' : 'bg-gray-500')} style={{ width: `${occupancyPercent}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Revenue: ₹{Math.round(show.revenue).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              <div className="flex border-t border-gray-800">
                <Link href={`/admin/shows/${show.id}`} className="flex-1 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-surface-active transition-colors text-center">Edit</Link>
                <div className="border-l border-gray-800" />
                <Link href={`/admin/shows/${show.id}/bookings`} className="flex-1 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-surface-active transition-colors text-center">Bookings</Link>
                <div className="border-l border-gray-800" />
                <button
                  onClick={() => handleCancel(show.id)}
                  disabled={show.status === 'cancelled' || show.status === 'completed'}
                  className="flex-1 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="px-3 py-1.5 rounded border border-gray-700 text-gray-300 disabled:opacity-50">Previous</button>
          <span className="text-sm text-gray-400">Page {data.pagination.page} of {data.pagination.pages}</span>
          <button disabled={page >= data.pagination.pages} onClick={() => setPage((prev) => Math.min(data.pagination.pages, prev + 1))} className="px-3 py-1.5 rounded border border-gray-700 text-gray-300 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
