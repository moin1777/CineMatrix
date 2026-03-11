'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Show {
  id: string;
  movieTitle: string;
  moviePoster: string;
  venue: string;
  screen: string;
  date: string;
  time: string;
  endTime: string;
  duration: number;
  bookedSeats: number;
  totalSeats: number;
  revenue: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

interface TimeSlot {
  hour: number;
  minute: number;
}

// ============================================================================
// SHOW CARD COMPONENT
// ============================================================================

const ShowCard: React.FC<{ show: Show; onEdit: () => void; onCancel: () => void }> = ({ 
  show, 
  onEdit, 
  onCancel 
}) => {
  const statusColors = {
    scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    ongoing: 'bg-green-500/10 text-green-400 border-green-500/20',
    completed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const occupancyPercent = Math.round((show.bookedSeats / show.totalSeats) * 100);

  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 overflow-hidden hover:border-primary-500/30 transition-colors">
      <div className="flex gap-4 p-4">
        {/* Movie Poster */}
        <div className="w-20 h-28 bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
          {show.moviePoster ? (
            <img src={show.moviePoster} alt={show.movieTitle} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white truncate">{show.movieTitle}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs border flex-shrink-0 ${statusColors[show.status]}`}>
              {show.status}
            </span>
          </div>

          <div className="mt-2 space-y-1 text-sm">
            <p className="text-gray-400">
              {show.venue} • {show.screen}
            </p>
            <p className="text-gray-400">
              {show.date} • {show.time} - {show.endTime}
            </p>
            <p className="text-gray-500 text-xs">
              Duration: {Math.floor(show.duration / 60)}h {show.duration % 60}m
            </p>
          </div>

          {/* Occupancy Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400">
                {show.bookedSeats}/{show.totalSeats} seats
              </span>
              <span className={cn(
                'font-medium',
                occupancyPercent >= 80 ? 'text-green-400' :
                occupancyPercent >= 50 ? 'text-yellow-400' : 'text-gray-400'
              )}>
                {occupancyPercent}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  occupancyPercent >= 80 ? 'bg-green-500' :
                  occupancyPercent >= 50 ? 'bg-yellow-500' : 'bg-gray-500'
                )}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex border-t border-gray-800">
        <button
          onClick={onEdit}
          className="flex-1 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-surface-active transition-colors"
        >
          Edit
        </button>
        <div className="border-l border-gray-800" />
        <Link
          href={`/admin/shows/${show.id}/bookings`}
          className="flex-1 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-surface-active transition-colors text-center"
        >
          Bookings
        </Link>
        <div className="border-l border-gray-800" />
        <button
          onClick={onCancel}
          disabled={show.status === 'cancelled' || show.status === 'completed'}
          className="flex-1 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// CALENDAR VIEW COMPONENT
// ============================================================================

interface CalendarViewProps {
  shows: Show[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ shows, selectedDate, onDateChange }) => {
  // Generate week days
  const weekDays = useMemo(() => {
    const days = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [selectedDate]);

  // Group shows by date
  const showsByDate = useMemo(() => {
    const grouped: Record<string, Show[]> = {};
    shows.forEach(show => {
      if (!grouped[show.date]) {
        grouped[show.date] = [];
      }
      grouped[show.date].push(show);
    });
    return grouped;
  }, [shows]);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const isSelected = (date: Date) => {
    return formatDate(date) === formatDate(selectedDate);
  };

  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            const prev = new Date(selectedDate);
            prev.setDate(prev.getDate() - 7);
            onDateChange(prev);
          }}
          className="p-2 rounded-lg hover:bg-surface-active text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="text-white font-medium">
          {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>

        <button
          onClick={() => {
            const next = new Date(selectedDate);
            next.setDate(next.getDate() + 7);
            onDateChange(next);
          }}
          className="p-2 rounded-lg hover:bg-surface-active text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const dateStr = formatDate(day);
          const dayShows = showsByDate[dateStr] || [];

          return (
            <button
              key={index}
              onClick={() => onDateChange(day)}
              className={cn(
                'p-3 rounded-lg text-center transition-colors relative',
                isSelected(day)
                  ? 'bg-primary-500 text-white'
                  : isToday(day)
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'bg-surface-active text-gray-400 hover:bg-gray-700 hover:text-white'
              )}
            >
              <p className="text-xs opacity-70">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <p className="text-lg font-bold">{day.getDate()}</p>
              {dayShows.length > 0 && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {dayShows.slice(0, 3).map((_, i) => (
                    <span key={i} className="w-1 h-1 rounded-full bg-current" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// TIMELINE VIEW COMPONENT
// ============================================================================

interface TimelineViewProps {
  shows: Show[];
  screens: string[];
  date: Date;
}

const TimelineView: React.FC<TimelineViewProps> = ({ shows, screens, date }) => {
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

  const getShowPosition = (show: Show) => {
    const [hours, minutes] = show.time.split(':').map(Number);
    const startMinutes = (hours - 6) * 60 + minutes;
    const width = show.duration;

    return {
      left: `${(startMinutes / (18 * 60)) * 100}%`,
      width: `${(width / (18 * 60)) * 100}%`,
    };
  };

  const dateStr = date.toISOString().split('T')[0];
  const filteredShows = shows.filter(show => show.date === dateStr);

  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-white font-medium">
          Timeline - {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Time Headers */}
          <div className="flex border-b border-gray-800">
            <div className="w-32 flex-shrink-0 p-2 bg-surface-active" />
            {hours.map(hour => (
              <div key={hour} className="flex-1 p-2 text-center text-xs text-gray-500 border-l border-gray-800">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Screens */}
          {screens.map(screen => {
            const screenShows = filteredShows.filter(show => show.screen === screen);

            return (
              <div key={screen} className="flex border-b border-gray-800 last:border-0">
                <div className="w-32 flex-shrink-0 p-3 bg-surface-active text-sm text-gray-400 flex items-center">
                  {screen}
                </div>
                <div className="flex-1 relative h-16">
                  {/* Grid lines */}
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className="absolute top-0 bottom-0 border-l border-gray-800"
                      style={{ left: `${((hour - 6) / 18) * 100}%` }}
                    />
                  ))}

                  {/* Shows */}
                  {screenShows.map(show => {
                    const pos = getShowPosition(show);
                    const occupancy = Math.round((show.bookedSeats / show.totalSeats) * 100);

                    return (
                      <div
                        key={show.id}
                        className={cn(
                          'absolute top-2 bottom-2 rounded-lg px-2 py-1 overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-white/20',
                          show.status === 'cancelled' ? 'bg-red-500/20' :
                          occupancy >= 80 ? 'bg-green-500/30' :
                          occupancy >= 50 ? 'bg-yellow-500/30' : 'bg-blue-500/30'
                        )}
                        style={{ left: pos.left, width: pos.width }}
                        title={`${show.movieTitle} (${show.time} - ${show.endTime})`}
                      >
                        <p className="text-xs text-white font-medium truncate">{show.movieTitle}</p>
                        <p className="text-xs text-gray-400">{show.time}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ShowsPage() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'timeline'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [venueFilter, setVenueFilter] = useState<string>('all');

  // Mock data
  const shows: Show[] = [
    {
      id: '1',
      movieTitle: 'Pushpa 2: The Rule',
      moviePoster: '',
      venue: 'PVR Cinemas',
      screen: 'Screen 1',
      date: new Date().toISOString().split('T')[0],
      time: '09:30',
      endTime: '12:45',
      duration: 195,
      bookedSeats: 145,
      totalSeats: 200,
      revenue: 43500,
      status: 'scheduled',
    },
    {
      id: '2',
      movieTitle: 'Pushpa 2: The Rule',
      moviePoster: '',
      venue: 'PVR Cinemas',
      screen: 'Screen 1',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      endTime: '17:15',
      duration: 195,
      bookedSeats: 180,
      totalSeats: 200,
      revenue: 54000,
      status: 'ongoing',
    },
    {
      id: '3',
      movieTitle: 'Avatar 3',
      moviePoster: '',
      venue: 'PVR Cinemas',
      screen: 'Screen 2',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      endTime: '13:00',
      duration: 180,
      bookedSeats: 120,
      totalSeats: 150,
      revenue: 42000,
      status: 'completed',
    },
    {
      id: '4',
      movieTitle: 'KGF Chapter 3',
      moviePoster: '',
      venue: 'INOX Multiplex',
      screen: 'Screen 1',
      date: new Date().toISOString().split('T')[0],
      time: '18:30',
      endTime: '21:30',
      duration: 180,
      bookedSeats: 200,
      totalSeats: 200,
      revenue: 80000,
      status: 'scheduled',
    },
    {
      id: '5',
      movieTitle: 'RRR 2',
      moviePoster: '',
      venue: 'INOX Multiplex',
      screen: 'Screen 2',
      date: new Date().toISOString().split('T')[0],
      time: '11:00',
      endTime: '14:15',
      duration: 195,
      bookedSeats: 50,
      totalSeats: 180,
      revenue: 12500,
      status: 'cancelled',
    },
  ];

  const venues = useMemo(() => 
    Array.from(new Set(shows.map(s => s.venue))),
    [shows]
  );

  const screens = useMemo(() => 
    Array.from(new Set(shows.map(s => s.screen))),
    [shows]
  );

  const filteredShows = useMemo(() => {
    return shows.filter(show => {
      const matchesSearch = show.movieTitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || show.status === statusFilter;
      const matchesVenue = venueFilter === 'all' || show.venue === venueFilter;
      return matchesSearch && matchesStatus && matchesVenue;
    });
  }, [shows, searchQuery, statusFilter, venueFilter]);

  const stats = {
    total: shows.length,
    active: shows.filter(s => s.status === 'scheduled' || s.status === 'ongoing').length,
    totalRevenue: shows.reduce((sum, s) => sum + s.revenue, 0),
    avgOccupancy: Math.round(
      shows.reduce((sum, s) => sum + (s.bookedSeats / s.totalSeats), 0) / shows.length * 100
    ),
  };

  const handleEdit = (showId: string) => {
    console.log('Edit show:', showId);
  };

  const handleCancel = (showId: string) => {
    if (window.confirm('Are you sure you want to cancel this show?')) {
      console.log('Cancel show:', showId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Shows & Scheduling</h1>
          <p className="text-gray-400">Manage movie schedules and time slots</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/shows/calendar"
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Full Calendar
          </Link>
          <Link
            href="/admin/shows/create"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Schedule Show
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Total Shows Today</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Active Shows</p>
          <p className="text-2xl font-bold text-green-400">{stats.active}</p>
        </div>
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Today's Revenue</p>
          <p className="text-2xl font-bold text-white">₹{stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Avg. Occupancy</p>
          <p className="text-2xl font-bold text-primary-400">{stats.avgOccupancy}%</p>
        </div>
      </div>

      {/* View Toggle & Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* View Mode Toggle */}
        <div className="flex bg-surface-active rounded-lg p-1">
          {(['list', 'calendar', 'timeline'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                viewMode === mode
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
            className="px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
          >
            <option value="all">All Venues</option>
            {venues.map(venue => (
              <option key={venue} value={venue}>{venue}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar View (shown with all view modes) */}
      {(viewMode === 'calendar' || viewMode === 'timeline') && (
        <CalendarView
          shows={filteredShows}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <TimelineView
          shows={filteredShows}
          screens={screens}
          date={selectedDate}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredShows.map(show => (
            <ShowCard
              key={show.id}
              show={show}
              onEdit={() => handleEdit(show.id)}
              onCancel={() => handleCancel(show.id)}
            />
          ))}
        </div>
      )}

      {filteredShows.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">No shows found</h3>
          <p className="text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
