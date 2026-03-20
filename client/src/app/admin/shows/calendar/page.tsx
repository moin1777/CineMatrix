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
  venue: string;
  venueId: string;
  screen: string;
  date: string;
  time: string;
  endTimeLabel: string;
  bookedSeats: number;
  totalSeats: number;
  status: ShowStatus;
}

interface ShowsResponse {
  items: ShowItem[];
  filters: { venues: Array<{ id: string; name: string }>; screens: string[] };
}

export default function CalendarPage() {
  const { isAuthenticated, isLoading } = useAuth();

  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [venueFilter, setVenueFilter] = useState('all');

  const [data, setData] = useState<ShowsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthRange = useMemo(() => {
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const last = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    return {
      from: first.toISOString().split('T')[0],
      to: last.toISOString().split('T')[0]
    };
  }, [viewDate]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<ShowsResponse>(`/admin/shows?limit=500&page=1&from=${monthRange.from}&to=${monthRange.to}&venue=${venueFilter}`);
        setData(response);
      } catch (err: any) {
        setError(err?.message || 'Failed to load calendar shows');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [monthRange.from, monthRange.to, venueFilter, isAuthenticated, isLoading]);

  const shows = data?.items || [];

  const showsByDate = useMemo(() => {
    const grouped: Record<string, ShowItem[]> = {};
    for (const show of shows) {
      if (!grouped[show.date]) grouped[show.date] = [];
      grouped[show.date].push(show);
    }
    return grouped;
  }, [shows]);

  const monthGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: Date[] = [];
    for (let i = firstDay.getDay() - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    while (days.length % 7 !== 0) {
      days.push(new Date(year, month + 1, days.length - lastDay.getDate() - firstDay.getDay() + 1));
    }
    return days;
  }, [viewDate]);

  const selectedDateKey = selectedDate.toISOString().split('T')[0];

  if (isLoading || loading) {
    return <div className="h-40 bg-surface-card rounded-xl border border-gray-800 animate-pulse" />;
  }

  if (error && !data) {
    return <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/shows" className="p-2 hover:bg-surface-active rounded-lg text-gray-400 hover:text-white">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Show Calendar</h1>
            <p className="text-gray-400">Month and day views from live scheduled shows.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const today = new Date();
              setViewDate(today);
              setSelectedDate(today);
            }}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Today
          </button>
          <Link href="/admin/shows/create" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            New Show
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-surface-active text-gray-400 hover:text-white">←</button>
          <h2 className="text-xl font-semibold text-white min-w-[200px] text-center">{viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-surface-active text-gray-400 hover:text-white">→</button>
        </div>

        <div className="flex items-center gap-3">
          <select value={venueFilter} onChange={(event) => setVenueFilter(event.target.value)} className="px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white">
            <option value="all">All Venues</option>
            {(data?.filters.venues || []).map((venue) => (
              <option key={venue.id} value={venue.id}>{venue.name}</option>
            ))}
          </select>

          <div className="flex bg-surface-active rounded-lg p-1">
            <button onClick={() => setViewMode('month')} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', viewMode === 'month' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white')}>Month</button>
            <button onClick={() => setViewMode('day')} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', viewMode === 'day' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white')}>Day</button>
          </div>
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="bg-surface-card rounded-xl border border-gray-800 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-800">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <div key={day} className="p-3 text-center text-sm text-gray-400 bg-surface-active">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {monthGrid.map((day) => {
              const key = day.toISOString().split('T')[0];
              const dayShows = showsByDate[key] || [];
              const isCurrentMonth = day.getMonth() === viewDate.getMonth();
              const isToday = key === new Date().toISOString().split('T')[0];

              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedDate(day);
                    setViewMode('day');
                  }}
                  className={cn('min-h-[130px] border-r border-b border-gray-800 p-2 text-left transition-colors', isCurrentMonth ? 'bg-surface-default hover:bg-surface-active/50' : 'bg-surface-active/40')}
                >
                  <span className={cn('inline-flex w-7 h-7 rounded-full items-center justify-center text-sm mb-2', isToday ? 'bg-primary-500 text-white font-bold' : isCurrentMonth ? 'text-white' : 'text-gray-600')}>
                    {day.getDate()}
                  </span>

                  <div className="space-y-1">
                    {dayShows.slice(0, 3).map((show) => (
                      <div key={show.id} className="px-2 py-1 rounded text-xs text-white bg-primary-500/70 truncate">
                        {show.time} {show.movieTitle}
                      </div>
                    ))}
                    {dayShows.length > 3 && <p className="text-xs text-gray-500">+{dayShows.length - 3} more</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'day' && (
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <h3 className="text-white font-semibold mb-4">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          <div className="space-y-2">
            {(showsByDate[selectedDateKey] || []).length === 0 && <p className="text-gray-500 text-sm">No shows scheduled for this date.</p>}
            {(showsByDate[selectedDateKey] || []).map((show) => (
              <div key={show.id} className="p-3 bg-surface-active rounded-lg border border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{show.movieTitle}</p>
                  <p className="text-gray-400 text-sm">{show.time} - {show.endTimeLabel} • {show.venue} • {show.screen}</p>
                </div>
                <span className={cn('px-2 py-1 rounded-full text-xs', show.status === 'ongoing' ? 'bg-green-500/20 text-green-400' : show.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' : show.status === 'completed' ? 'bg-gray-500/20 text-gray-400' : 'bg-red-500/20 text-red-400')}>
                  {show.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
