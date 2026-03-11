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
  movieId: string;
  venue: string;
  venueId: string;
  screen: string;
  screenId: string;
  date: string;
  time: string;
  endTime: string;
  duration: number;
  bookedSeats: number;
  totalSeats: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  shows: Show[];
}

// ============================================================================
// MINI CALENDAR COMPONENT
// ============================================================================

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  showCounts: Record<string, number>;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ selectedDate, onDateSelect, showCounts }) => {
  const [viewDate, setViewDate] = useState(selectedDate);

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: CalendarDay[] = [];
    
    // Add days from previous month to fill the first week
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        shows: [],
      });
    }
    
    // Add days of current month
    const today = new Date();
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date,
        isCurrentMonth: true,
        isToday: dateStr === today.toISOString().split('T')[0],
        shows: [],
      });
    }
    
    // Add days from next month to fill the last week
    const endPadding = 6 - lastDay.getDay();
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        shows: [],
      });
    }
    
    return days;
  }, [viewDate]);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          className="p-1.5 rounded-lg hover:bg-surface-active text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-white font-medium">
          {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          className="p-1.5 rounded-lg hover:bg-surface-active text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day, index) => {
          const dateStr = formatDate(day.date);
          const isSelected = dateStr === formatDate(selectedDate);
          const showCount = showCounts[dateStr] || 0;

          return (
            <button
              key={index}
              onClick={() => onDateSelect(day.date)}
              className={cn(
                'relative aspect-square flex items-center justify-center text-sm rounded-lg transition-colors',
                isSelected
                  ? 'bg-primary-500 text-white'
                  : day.isToday
                  ? 'bg-primary-500/20 text-primary-400'
                  : day.isCurrentMonth
                  ? 'text-white hover:bg-surface-active'
                  : 'text-gray-600'
              )}
            >
              {day.date.getDate()}
              {showCount > 0 && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// FULL CALENDAR GRID COMPONENT
// ============================================================================

interface FullCalendarGridProps {
  shows: Show[];
  viewDate: Date;
  onShowClick: (show: Show) => void;
}

const FullCalendarGrid: React.FC<FullCalendarGridProps> = ({ shows, viewDate, onShowClick }) => {
  const weeks = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];
    
    // Add days from previous month
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      const dateStr = date.toISOString().split('T')[0];
      currentWeek.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        shows: shows.filter(s => s.date === dateStr),
      });
    }
    
    // Add days of current month
    const today = new Date();
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      
      currentWeek.push({
        date,
        isCurrentMonth: true,
        isToday: dateStr === today.toISOString().split('T')[0],
        shows: shows.filter(s => s.date === dateStr),
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Add days from next month
    if (currentWeek.length > 0) {
      const remaining = 7 - currentWeek.length;
      for (let i = 1; i <= remaining; i++) {
        const date = new Date(year, month + 1, i);
        const dateStr = date.toISOString().split('T')[0];
        currentWeek.push({
          date,
          isCurrentMonth: false,
          isToday: false,
          shows: shows.filter(s => s.date === dateStr),
        });
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [viewDate, shows]);

  const statusColors = {
    scheduled: 'bg-blue-500',
    ongoing: 'bg-green-500',
    completed: 'bg-gray-500',
    cancelled: 'bg-red-500',
  };

  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-gray-800">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <div key={day} className="p-3 text-center text-sm text-gray-400 bg-surface-active">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar weeks */}
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-800 last:border-0">
          {week.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={cn(
                'min-h-[140px] border-r border-gray-800 last:border-r-0 p-2',
                day.isCurrentMonth ? 'bg-surface-default' : 'bg-surface-active/50'
              )}
            >
              {/* Date number */}
              <div className={cn(
                'flex items-center justify-center w-7 h-7 rounded-full text-sm mb-2',
                day.isToday
                  ? 'bg-primary-500 text-white font-bold'
                  : day.isCurrentMonth
                  ? 'text-white'
                  : 'text-gray-600'
              )}>
                {day.date.getDate()}
              </div>

              {/* Shows */}
              <div className="space-y-1">
                {day.shows.slice(0, 3).map(show => (
                  <button
                    key={show.id}
                    onClick={() => onShowClick(show)}
                    className={cn(
                      'w-full px-2 py-1 rounded text-xs text-white text-left truncate transition-opacity hover:opacity-80',
                      statusColors[show.status]
                    )}
                  >
                    {show.time} {show.movieTitle}
                  </button>
                ))}
                {day.shows.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{day.shows.length - 3} more
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// DAY VIEW COMPONENT
// ============================================================================

interface DayViewProps {
  shows: Show[];
  date: Date;
  screens: string[];
  onShowClick: (show: Show) => void;
}

const DayView: React.FC<DayViewProps> = ({ shows, date, screens, onShowClick }) => {
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM
  const dateStr = date.toISOString().split('T')[0];
  
  const filteredShows = shows.filter(s => s.date === dateStr);

  const getShowStyle = (show: Show) => {
    const [startHour, startMin] = show.time.split(':').map(Number);
    const [endHour, endMin] = show.endTime.split(':').map(Number);
    
    const startMinutes = (startHour - 6) * 60 + startMin;
    const endMinutes = (endHour - 6) * 60 + endMin;
    const duration = endMinutes - startMinutes;

    return {
      top: `${(startMinutes / 60) * 60}px`, // 60px per hour
      height: `${(duration / 60) * 60}px`,
    };
  };

  const statusColors = {
    scheduled: 'bg-blue-500/20 border-blue-500 text-blue-300',
    ongoing: 'bg-green-500/20 border-green-500 text-green-300',
    completed: 'bg-gray-500/20 border-gray-500 text-gray-300',
    cancelled: 'bg-red-500/20 border-red-500 text-red-300',
  };

  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-white font-medium">
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </h3>
        <p className="text-gray-400 text-sm">{filteredShows.length} shows scheduled</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="flex border-b border-gray-800 sticky top-0 bg-surface-card z-10">
            <div className="w-20 flex-shrink-0 p-2 bg-surface-active text-xs text-gray-500 text-center">
              Time
            </div>
            {screens.map(screen => (
              <div key={screen} className="flex-1 p-2 bg-surface-active text-sm text-gray-400 text-center border-l border-gray-800">
                {screen}
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="flex relative">
            {/* Time labels */}
            <div className="w-20 flex-shrink-0">
              {hours.map(hour => (
                <div
                  key={hour}
                  className="h-[60px] px-2 py-1 text-xs text-gray-500 text-right border-b border-gray-800"
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Screen columns */}
            {screens.map(screen => {
              const screenShows = filteredShows.filter(s => s.screen === screen);

              return (
                <div
                  key={screen}
                  className="flex-1 relative border-l border-gray-800"
                >
                  {/* Hour grid lines */}
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className="h-[60px] border-b border-gray-800"
                    />
                  ))}

                  {/* Shows */}
                  {screenShows.map(show => {
                    const style = getShowStyle(show);
                    const occupancy = Math.round((show.bookedSeats / show.totalSeats) * 100);

                    return (
                      <button
                        key={show.id}
                        onClick={() => onShowClick(show)}
                        className={cn(
                          'absolute left-1 right-1 rounded-lg border-l-4 p-2 overflow-hidden transition-all hover:ring-2 hover:ring-white/20',
                          statusColors[show.status]
                        )}
                        style={style}
                      >
                        <p className="text-sm font-medium truncate">{show.movieTitle}</p>
                        <p className="text-xs opacity-70">
                          {show.time} - {show.endTime}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span>{occupancy}% booked</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SHOW DETAIL MODAL
// ============================================================================

interface ShowDetailModalProps {
  show: Show | null;
  onClose: () => void;
}

const ShowDetailModal: React.FC<ShowDetailModalProps> = ({ show, onClose }) => {
  if (!show) return null;

  const occupancy = Math.round((show.bookedSeats / show.totalSeats) * 100);

  const statusColors = {
    scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    ongoing: 'bg-green-500/10 text-green-400 border-green-500/20',
    completed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      
      <div className="relative bg-surface-card rounded-xl border border-gray-800 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Show Details</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-24 bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{show.movieTitle}</h3>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs border ${statusColors[show.status]}`}>
                {show.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Venue</p>
              <p className="text-white">{show.venue}</p>
            </div>
            <div>
              <p className="text-gray-500">Screen</p>
              <p className="text-white">{show.screen}</p>
            </div>
            <div>
              <p className="text-gray-500">Date</p>
              <p className="text-white">{new Date(show.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Time</p>
              <p className="text-white">{show.time} - {show.endTime}</p>
            </div>
          </div>

          {/* Occupancy */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Occupancy</span>
              <span className="text-white font-medium">{show.bookedSeats}/{show.totalSeats} ({occupancy}%)</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  occupancy >= 80 ? 'bg-green-500' :
                  occupancy >= 50 ? 'bg-yellow-500' : 'bg-gray-500'
                )}
                style={{ width: `${occupancy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex border-t border-gray-800">
          <Link
            href={`/admin/shows/${show.id}`}
            className="flex-1 py-3 text-center text-sm text-gray-400 hover:text-white hover:bg-surface-active transition-colors"
          >
            Edit Show
          </Link>
          <div className="border-l border-gray-800" />
          <Link
            href={`/admin/shows/${show.id}/bookings`}
            className="flex-1 py-3 text-center text-sm text-primary-400 hover:text-primary-300 hover:bg-surface-active transition-colors"
          >
            View Bookings
          </Link>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [venueFilter, setVenueFilter] = useState<string>('all');

  // Mock data - generates shows for the current month
  const shows: Show[] = useMemo(() => {
    const result: Show[] = [];
    const baseDate = new Date();
    
    const movies = ['Pushpa 2: The Rule', 'Avatar 3', 'KGF Chapter 3', 'RRR 2', 'Inception 2'];
    const venues = ['PVR Cinemas', 'INOX Multiplex'];
    const screens = ['Screen 1', 'Screen 2', 'Screen 3'];
    const times = ['09:30', '12:00', '15:00', '18:00', '21:00'];
    const statuses: Show['status'][] = ['scheduled', 'ongoing', 'completed'];
    
    // Generate shows for the next 30 days
    for (let d = -5; d < 30; d++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];
      
      // 3-8 shows per day
      const showCount = 3 + Math.floor(Math.random() * 6);
      
      for (let i = 0; i < showCount; i++) {
        const movie = movies[Math.floor(Math.random() * movies.length)];
        const venue = venues[Math.floor(Math.random() * venues.length)];
        const screen = screens[Math.floor(Math.random() * screens.length)];
        const time = times[Math.floor(Math.random() * times.length)];
        const duration = 150 + Math.floor(Math.random() * 60);
        const totalSeats = 100 + Math.floor(Math.random() * 100);
        
        const [hours, minutes] = time.split(':').map(Number);
        const endHours = hours + Math.floor(duration / 60);
        const endMinutes = minutes + (duration % 60);
        const endTime = `${(endHours + Math.floor(endMinutes / 60)).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
        
        result.push({
          id: `show-${d}-${i}`,
          movieId: `m${i}`,
          movieTitle: movie,
          venue,
          venueId: venue === 'PVR Cinemas' ? 'v1' : 'v2',
          screen,
          screenId: `s${screens.indexOf(screen) + 1}`,
          date: dateStr,
          time,
          endTime,
          duration,
          bookedSeats: Math.floor(Math.random() * totalSeats),
          totalSeats,
          status: d < 0 ? 'completed' : statuses[Math.floor(Math.random() * statuses.length)],
        });
      }
    }
    
    return result;
  }, []);

  const venues = useMemo(() => Array.from(new Set(shows.map(s => s.venue))), [shows]);
  const screens = useMemo(() => Array.from(new Set(shows.map(s => s.screen))), [shows]);

  const filteredShows = useMemo(() => {
    if (venueFilter === 'all') return shows;
    return shows.filter(s => s.venue === venueFilter);
  }, [shows, venueFilter]);

  const showCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredShows.forEach(show => {
      counts[show.date] = (counts[show.date] || 0) + 1;
    });
    return counts;
  }, [filteredShows]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    setSelectedDate(today);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/shows"
            className="p-2 hover:bg-surface-active rounded-lg text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Show Calendar</h1>
            <p className="text-gray-400">View and manage scheduled shows</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToday}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Today
          </button>
          <Link
            href="/admin/shows/create"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Show
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Month Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-surface-active text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-white min-w-[200px] text-center">
            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-surface-active text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex items-center gap-3">
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

          <div className="flex bg-surface-active rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                viewMode === 'month'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                viewMode === 'day'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mini Calendar Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <MiniCalendar
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
              if (viewMode === 'day') {
                setViewDate(date);
              }
            }}
            showCounts={showCounts}
          />

          {/* Legend */}
          <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
            <h4 className="text-white font-medium mb-3">Status Legend</h4>
            <div className="space-y-2">
              {[
                { status: 'scheduled', label: 'Scheduled', color: 'bg-blue-500' },
                { status: 'ongoing', label: 'Ongoing', color: 'bg-green-500' },
                { status: 'completed', label: 'Completed', color: 'bg-gray-500' },
                { status: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
              ].map(item => (
                <div key={item.status} className="flex items-center gap-2 text-sm">
                  <span className={`w-3 h-3 rounded ${item.color}`} />
                  <span className="text-gray-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
            <h4 className="text-white font-medium mb-3">This Month</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Shows</span>
                <span className="text-white font-medium">{filteredShows.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active</span>
                <span className="text-green-400 font-medium">
                  {filteredShows.filter(s => s.status === 'scheduled' || s.status === 'ongoing').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cancelled</span>
                <span className="text-red-400 font-medium">
                  {filteredShows.filter(s => s.status === 'cancelled').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Calendar View */}
        <div className="lg:col-span-3">
          {viewMode === 'month' ? (
            <FullCalendarGrid
              shows={filteredShows}
              viewDate={viewDate}
              onShowClick={setSelectedShow}
            />
          ) : (
            <DayView
              shows={filteredShows}
              date={selectedDate}
              screens={screens}
              onShowClick={setSelectedShow}
            />
          )}
        </div>
      </div>

      {/* Show Detail Modal */}
      <ShowDetailModal
        show={selectedShow}
        onClose={() => setSelectedShow(null)}
      />
    </div>
  );
}
