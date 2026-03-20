'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Movie {
  id: string;
  _id?: string;
  title: string;
  duration: number; // minutes
  poster: string;
  genre: string[];
  rating: string;
}

interface Venue {
  id: string;
  _id?: string;
  name: string;
  screens: Screen[];
}

interface Screen {
  id: string;
  _id?: string;
  name: string;
  capacity: number;
  basePrice?: number;
}

interface ExistingShow {
  id: string;
  movieId: string;
  movieTitle: string;
  screenId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  isConflict: boolean;
  conflictingShow?: ExistingShow;
}

interface ScheduleForm {
  movieId: string;
  venueId: string;
  screenId: string;
  date: string;
  time: string;
  cleanupTime: number; // buffer time after show (minutes)
  pricingTier: string;
  recurring: boolean;
  recurringDays: number[];
  recurringUntil: string;
}

// ============================================================================
// CONFLICT DETECTION UTILITIES
// ============================================================================

const parseTime = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const startMinutes = parseTime(startTime);
  const endMinutes = startMinutes + durationMinutes;
  return formatTime(endMinutes);
};

const hasTimeOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const s1 = parseTime(start1);
  const e1 = parseTime(end1);
  const s2 = parseTime(start2);
  const e2 = parseTime(end2);
  
  return s1 < e2 && s2 < e1;
};

// ============================================================================
// MOVIE SELECTOR COMPONENT
// ============================================================================

interface MovieSelectorProps {
  movies: Movie[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const MovieSelector: React.FC<MovieSelectorProps> = ({ movies, selectedId, onSelect }) => {
  const [search, setSearch] = useState('');
  
  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const selectedMovie = movies.find(m => m.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search movies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-surface-active border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
        />
      </div>

      {selectedMovie && (
        <div className="flex items-center gap-4 p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
          <div className="w-12 h-16 bg-gray-700 rounded flex-shrink-0 flex items-center justify-center">
            {selectedMovie.poster ? (
              <img src={selectedMovie.poster} alt="" className="w-full h-full object-cover rounded" />
            ) : (
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium truncate">{selectedMovie.title}</h4>
            <p className="text-gray-400 text-sm">
              {Math.floor(selectedMovie.duration / 60)}h {selectedMovie.duration % 60}m • {selectedMovie.rating}
            </p>
          </div>
          <button
            onClick={() => onSelect('')}
            className="p-1 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto space-y-2">
        {filteredMovies.map(movie => (
          <button
            key={movie.id}
            onClick={() => onSelect(movie.id)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
              movie.id === selectedId
                ? 'bg-primary-500/20 border border-primary-500/30'
                : 'bg-surface-active hover:bg-gray-700'
            )}
          >
            <div className="w-10 h-14 bg-gray-700 rounded flex-shrink-0 flex items-center justify-center">
              {movie.poster ? (
                <img src={movie.poster} alt="" className="w-full h-full object-cover rounded" />
              ) : (
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white truncate">{movie.title}</p>
              <p className="text-gray-500 text-sm">
                {Math.floor(movie.duration / 60)}h {movie.duration % 60}m • {movie.genre.slice(0, 2).join(', ')}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// TIME SLOT PICKER WITH CONFLICT DETECTION
// ============================================================================

interface TimeSlotPickerProps {
  selectedTime: string;
  onSelect: (time: string) => void;
  screenId: string;
  date: string;
  movieDuration: number;
  cleanupTime: number;
  existingShows: ExistingShow[];
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedTime,
  onSelect,
  screenId,
  date,
  movieDuration,
  cleanupTime,
  existingShows,
}) => {
  // Generate time slots every 30 minutes from 6 AM to 11 PM
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    const totalDuration = movieDuration + cleanupTime;
    
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = formatTime(hour * 60 + minute);
        const endTime = calculateEndTime(time, totalDuration);
        
        // Check for conflicts with existing shows
        const screenShows = existingShows.filter(
          s => s.screenId === screenId && s.date === date
        );
        
        let isConflict = false;
        let conflictingShow: ExistingShow | undefined;
        
        for (const show of screenShows) {
          if (hasTimeOverlap(time, endTime, show.startTime, show.endTime)) {
            isConflict = true;
            conflictingShow = show;
            break;
          }
        }
        
        slots.push({
          startTime: time,
          endTime,
          isConflict,
          conflictingShow,
        });
      }
    }
    
    return slots;
  }, [screenId, date, movieDuration, cleanupTime, existingShows]);

  const selectedSlot = timeSlots.find(s => s.startTime === selectedTime);

  return (
    <div className="space-y-4">
      {/* Selected time display */}
      {selectedSlot && (
        <div className={cn(
          'p-4 rounded-lg border',
          selectedSlot.isConflict 
            ? 'bg-red-500/10 border-red-500/30' 
            : 'bg-green-500/10 border-green-500/30'
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">
                {selectedSlot.startTime} - {selectedSlot.endTime}
              </p>
              <p className="text-sm text-gray-400">
                Duration: {Math.floor(movieDuration / 60)}h {movieDuration % 60}m
                {cleanupTime > 0 && ` + ${cleanupTime}min cleanup`}
              </p>
            </div>
            {selectedSlot.isConflict ? (
              <div className="flex items-center gap-2 text-red-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm">Conflict!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Available</span>
              </div>
            )}
          </div>
          {selectedSlot.isConflict && selectedSlot.conflictingShow && (
            <div className="mt-2 pt-2 border-t border-red-500/20 text-sm text-red-300">
              Overlaps with: {selectedSlot.conflictingShow.movieTitle} 
              ({selectedSlot.conflictingShow.startTime} - {selectedSlot.conflictingShow.endTime})
            </div>
          )}
        </div>
      )}

      {/* Time grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
        {timeSlots.map(slot => (
          <button
            key={slot.startTime}
            onClick={() => onSelect(slot.startTime)}
            disabled={slot.isConflict}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              slot.startTime === selectedTime
                ? slot.isConflict
                  ? 'bg-red-500 text-white'
                  : 'bg-primary-500 text-white'
                : slot.isConflict
                ? 'bg-red-500/10 text-red-400 cursor-not-allowed'
                : 'bg-surface-active text-gray-400 hover:bg-gray-700 hover:text-white'
            )}
            title={slot.isConflict ? `Conflict: ${slot.conflictingShow?.movieTitle}` : ''}
          >
            {slot.startTime}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-surface-active"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-500/30"></span>
          <span>Conflict</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-primary-500"></span>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TIMELINE PREVIEW COMPONENT
// ============================================================================

interface TimelinePreviewProps {
  screenName: string;
  date: string;
  existingShows: ExistingShow[];
  newShow?: { startTime: string; endTime: string; title: string };
  screenId: string;
}

const TimelinePreview: React.FC<TimelinePreviewProps> = ({
  screenName,
  date,
  existingShows,
  newShow,
  screenId,
}) => {
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  
  const screenShows = existingShows.filter(
    s => s.screenId === screenId && s.date === date
  );

  const getPosition = (startTime: string, endTime: string) => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const dayStart = 6 * 60; // 6 AM
    const dayDuration = 18 * 60; // 18 hours

    return {
      left: `${((start - dayStart) / dayDuration) * 100}%`,
      width: `${((end - start) / dayDuration) * 100}%`,
    };
  };

  const hasConflict = newShow && screenShows.some(show =>
    hasTimeOverlap(newShow.startTime, newShow.endTime, show.startTime, show.endTime)
  );

  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
      <h4 className="text-white font-medium mb-4">Timeline Preview - {screenName}</h4>
      
      <div className="relative">
        {/* Hour markers */}
        <div className="flex mb-2">
          {hours.map(hour => (
            <div
              key={hour}
              className="flex-1 text-xs text-gray-500 text-center"
            >
              {hour}:00
            </div>
          ))}
        </div>

        {/* Timeline bar */}
        <div className="relative h-16 bg-surface-active rounded-lg overflow-hidden">
          {/* Grid lines */}
          {hours.map((hour, i) => (
            <div
              key={hour}
              className="absolute top-0 bottom-0 border-l border-gray-700"
              style={{ left: `${(i / 18) * 100}%` }}
            />
          ))}

          {/* Existing shows */}
          {screenShows.map(show => {
            const pos = getPosition(show.startTime, show.endTime);
            return (
              <div
                key={show.id}
                className="absolute top-2 bottom-2 bg-blue-500/30 rounded px-2 flex items-center"
                style={{ left: pos.left, width: pos.width }}
              >
                <span className="text-xs text-blue-300 truncate">{show.movieTitle}</span>
              </div>
            );
          })}

          {/* New show preview */}
          {newShow && (
            <div
              className={cn(
                'absolute top-2 bottom-2 rounded px-2 flex items-center border-2 border-dashed',
                hasConflict
                  ? 'bg-red-500/30 border-red-500'
                  : 'bg-green-500/30 border-green-500'
              )}
              style={getPosition(newShow.startTime, newShow.endTime)}
            >
              <span className={cn(
                'text-xs truncate',
                hasConflict ? 'text-red-300' : 'text-green-300'
              )}>
                {newShow.title}
              </span>
            </div>
          )}
        </div>
      </div>

      {hasConflict && (
        <p className="mt-3 text-sm text-red-400 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          This time slot overlaps with existing shows!
        </p>
      )}
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function CreateShowPage() {
  const [form, setForm] = useState<ScheduleForm>({
    movieId: '',
    venueId: '',
    screenId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    cleanupTime: 15,
    pricingTier: 'regular',
    recurring: false,
    recurringDays: [],
    recurringUntil: '',
  });

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // API state
  const [movies, setMovies] = useState<Movie[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [existingShows, setExistingShows] = useState<ExistingShow[]>([]);
  const [fetchError, setFetchError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // Fetch movies and venues on mount
  React.useEffect(() => {
    async function fetchData() {
      setLoadingData(true);
      setFetchError('');
      try {
        const movieRes = await fetch('/api/events');
        const movieJson = await movieRes.json();
        const normalizedMovies: Movie[] = (movieJson.events || []).map((event: any) => ({
          id: event._id,
          _id: event._id,
          title: event.title,
          duration: event.durationMinutes,
          poster: event.posterUrl || '',
          genre: event.genre || [],
          rating: event.rating || 'NR'
        }));
        setMovies(normalizedMovies);

        const venueRes = await fetch('/api/venues');
        const venueJson = await venueRes.json();
        const venuesFromApi = venueJson.venues || [];

        const venuesWithScreens: Venue[] = await Promise.all(
          venuesFromApi.map(async (venue: any) => {
            try {
              const hallsRes = await fetch(`/api/venues/${venue._id}/halls`);
              const hallsJson = await hallsRes.json();
              const halls = hallsJson.halls || [];

              return {
                id: venue._id,
                _id: venue._id,
                name: venue.name,
                screens: halls.map((hall: any) => ({
                  id: hall._id,
                  _id: hall._id,
                  name: hall.name,
                  capacity: hall.capacity,
                  basePrice: hall.seatMap?.[0]?.price || 200
                }))
              };
            } catch {
              return {
                id: venue._id,
                _id: venue._id,
                name: venue.name,
                screens: []
              };
            }
          })
        );

        setVenues(venuesWithScreens);
      } catch (err: any) {
        setFetchError('Failed to load movies or venues');
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  // Fetch shows for selected screen/date
  React.useEffect(() => {
    async function fetchShows() {
      if (!form.venueId || !form.screenId || !form.date) return;
      try {
        const res = await fetch(`/api/events/venue/${form.venueId}/shows?date=${form.date}`);
        const json = await res.json();
        const mappedShows: ExistingShow[] = (json.shows || [])
          .filter((show: any) => {
            const hallId = typeof show.hallId === 'string' ? show.hallId : show.hallId?._id;
            return hallId === form.screenId;
          })
          .map((show: any) => {
            const start = new Date(show.startTime);
            const end = new Date(show.endTime);

            return {
              id: show._id,
              movieId: typeof show.eventId === 'string' ? show.eventId : show.eventId?._id,
              movieTitle: typeof show.eventId === 'string' ? 'Event' : show.eventId?.title || 'Event',
              screenId: typeof show.hallId === 'string' ? show.hallId : show.hallId?._id,
              date: form.date,
              startTime: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
              endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
              duration: Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
            };
          });

        setExistingShows(mappedShows);
      } catch {
        setExistingShows([]);
      }
    }
    fetchShows();
  }, [form.venueId, form.screenId, form.date]);

  const selectedMovie = movies.find(m => m._id === form.movieId || m.id === form.movieId);
  const selectedVenue = venues.find(v => v._id === form.venueId || v.id === form.venueId);
  const selectedScreen = selectedVenue?.screens?.find(s => s._id === form.screenId || s.id === form.screenId);

  const totalDuration = (selectedMovie?.duration || 0) + form.cleanupTime;
  const endTime = form.time ? calculateEndTime(form.time, totalDuration) : '';

  const hasConflict = useMemo(() => {
    if (!form.screenId || !form.time || !selectedMovie) return false;

    const screenShows = existingShows.filter(
      s => s.screenId === form.screenId && s.date === form.date
    );

    return screenShows.some(show =>
      hasTimeOverlap(form.time, endTime, show.startTime, show.endTime)
    );
  }, [form.screenId, form.time, form.date, endTime, existingShows, selectedMovie]);

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!form.movieId;
      case 2:
        return !!form.venueId && !!form.screenId;
      case 3:
        return !!form.time && !hasConflict;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFetchError("");
    try {
      // POST to backend
      const payload = {
        eventId: selectedMovie?._id || selectedMovie?.id,
        hallId: selectedScreen?._id || selectedScreen?.id,
        startTime: new Date(`${form.date}T${form.time}`),
        price: form.pricingTier === 'prime' ? 1.3 * (selectedScreen?.basePrice || 200) : form.pricingTier === 'special' ? 1.5 * (selectedScreen?.basePrice || 200) : (selectedScreen?.basePrice || 200),
      };
      const res = await fetch('/api/events/shows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create show');
      }
      setIsSubmitting(false);
      // Redirect to shows list
      window.location.href = '/admin/shows';
    } catch (err: any) {
      setFetchError(err.message || 'Failed to create show');
      setIsSubmitting(false);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loadingData) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
  }
  if (fetchError) {
    return <div className="flex items-center justify-center min-h-screen text-red-400">{fetchError}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
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
          <h1 className="text-2xl font-bold text-white">Schedule New Show</h1>
          <p className="text-gray-400">Set up movie screenings with conflict detection</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map(s => (
          <React.Fragment key={s}>
            <button
              onClick={() => s <= step && setStep(s)}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                s === step
                  ? 'bg-primary-500 text-white'
                  : s < step
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-surface-active text-gray-500'
              )}
            >
              {s < step ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s
              )}
            </button>
            {s < 4 && (
              <div className={cn(
                'flex-1 h-0.5 rounded',
                s < step ? 'bg-green-500' : 'bg-gray-700'
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between text-sm">
        <span className={cn('flex-1', step >= 1 ? 'text-white' : 'text-gray-500')}>Select Movie</span>
        <span className={cn('flex-1 text-center', step >= 2 ? 'text-white' : 'text-gray-500')}>Choose Screen</span>
        <span className={cn('flex-1 text-center', step >= 3 ? 'text-white' : 'text-gray-500')}>Set Time</span>
        <span className={cn('flex-1 text-right', step >= 4 ? 'text-white' : 'text-gray-500')}>Review</span>
      </div>

      {/* Step Content */}
      <div className="bg-surface-card rounded-xl border border-gray-800 p-6">
        {/* Step 1: Movie Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Select Movie</h2>
            <MovieSelector
              movies={movies}
              selectedId={form.movieId}
              onSelect={(id) => setForm(f => ({ ...f, movieId: id }))}
            />
          </div>
        )}

        {/* Step 2: Venue & Screen Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Choose Venue & Screen</h2>
            
            {/* Venue Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Venue</label>
              <select
                value={form.venueId}
                onChange={(e) => setForm(f => ({ ...f, venueId: e.target.value, screenId: '' }))}
                className="w-full px-4 py-2.5 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">Select venue...</option>
                {venues.map(venue => (
                  <option key={venue.id} value={venue.id}>{venue.name}</option>
                ))}
              </select>
            </div>

            {/* Screen Selection */}
            {selectedVenue && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Screen</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedVenue.screens.map(screen => {
                    const screenShows = existingShows.filter(
                      s => s.screenId === screen.id && s.date === form.date
                    );
                    
                    return (
                      <button
                        key={screen.id}
                        onClick={() => setForm(f => ({ ...f, screenId: screen.id }))}
                        className={cn(
                          'p-4 rounded-lg text-left transition-colors',
                          screen.id === form.screenId
                            ? 'bg-primary-500/20 border-2 border-primary-500'
                            : 'bg-surface-active border-2 border-transparent hover:border-gray-600'
                        )}
                      >
                        <p className="text-white font-medium">{screen.name}</p>
                        <p className="text-gray-400 text-sm">{screen.capacity} seats</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {screenShows.length} shows scheduled today
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Time Selection */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Set Date & Time</h2>

            {/* Date Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Show Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm(f => ({ ...f, date: e.target.value, time: '' }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full sm:w-auto px-4 py-2.5 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Cleanup Time */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Cleanup/Buffer Time (minutes)
              </label>
              <div className="flex gap-2">
                {[0, 10, 15, 20, 30].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setForm(f => ({ ...f, cleanupTime: mins }))}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm',
                      form.cleanupTime === mins
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-active text-gray-400 hover:text-white'
                    )}
                  >
                    {mins}min
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Start Time</label>
              <TimeSlotPicker
                selectedTime={form.time}
                onSelect={(time) => setForm(f => ({ ...f, time }))}
                screenId={form.screenId}
                date={form.date}
                movieDuration={selectedMovie?.duration || 0}
                cleanupTime={form.cleanupTime}
                existingShows={existingShows}
              />
            </div>

            {/* Timeline Preview */}
            {form.screenId && (
              <TimelinePreview
                screenName={selectedScreen?.name || ''}
                date={form.date}
                existingShows={existingShows}
                screenId={form.screenId}
                newShow={form.time && selectedMovie ? {
                  startTime: form.time,
                  endTime,
                  title: selectedMovie.title,
                } : undefined}
              />
            )}

            {/* Recurring Options */}
            <div className="pt-4 border-t border-gray-800">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.recurring}
                  onChange={(e) => setForm(f => ({ ...f, recurring: e.target.checked }))}
                  className="w-5 h-5 rounded bg-surface-active border-gray-600 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-white">Create recurring shows</span>
              </label>

              {form.recurring && (
                <div className="mt-4 space-y-4 pl-8">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Repeat on</label>
                    <div className="flex gap-2">
                      {dayNames.map((day, index) => (
                        <button
                          key={day}
                          onClick={() => {
                            const days = form.recurringDays.includes(index)
                              ? form.recurringDays.filter(d => d !== index)
                              : [...form.recurringDays, index];
                            setForm(f => ({ ...f, recurringDays: days }));
                          }}
                          className={cn(
                            'w-10 h-10 rounded-lg text-sm',
                            form.recurringDays.includes(index)
                              ? 'bg-primary-500 text-white'
                              : 'bg-surface-active text-gray-400 hover:text-white'
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Until</label>
                    <input
                      type="date"
                      value={form.recurringUntil}
                      onChange={(e) => setForm(f => ({ ...f, recurringUntil: e.target.value }))}
                      min={form.date}
                      className="px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review & Pricing */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Review & Pricing</h2>

            {/* Summary */}
            <div className="bg-surface-active rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-24 bg-gray-700 rounded flex-shrink-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedMovie?.title}</h3>
                  <p className="text-gray-400">
                    {Math.floor((selectedMovie?.duration || 0) / 60)}h {(selectedMovie?.duration || 0) % 60}m
                    • {selectedMovie?.rating}
                  </p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-700 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Venue</p>
                  <p className="text-white">{selectedVenue?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Screen</p>
                  <p className="text-white">{selectedScreen?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="text-white">{new Date(form.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-gray-500">Time</p>
                  <p className="text-white">{form.time} - {endTime}</p>
                </div>
                <div>
                  <p className="text-gray-500">Capacity</p>
                  <p className="text-white">{selectedScreen?.capacity} seats</p>
                </div>
                <div>
                  <p className="text-gray-500">Buffer Time</p>
                  <p className="text-white">{form.cleanupTime} minutes</p>
                </div>
              </div>

              {form.recurring && form.recurringDays.length > 0 && (
                <div className="pt-3 border-t border-gray-700">
                  <p className="text-gray-500 text-sm">Recurring</p>
                  <p className="text-white text-sm">
                    Every {form.recurringDays.map(d => dayNames[d]).join(', ')}
                    {form.recurringUntil && ` until ${new Date(form.recurringUntil).toLocaleDateString()}`}
                  </p>
                </div>
              )}
            </div>

            {/* Pricing Tier */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Pricing Tier</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'regular', name: 'Regular', multiplier: '1.0x', desc: 'Standard pricing' },
                  { id: 'prime', name: 'Prime Time', multiplier: '1.3x', desc: 'Peak hours' },
                  { id: 'special', name: 'Special', multiplier: '1.5x', desc: 'Premiere/Event' },
                ].map(tier => (
                  <button
                    key={tier.id}
                    onClick={() => setForm(f => ({ ...f, pricingTier: tier.id }))}
                    className={cn(
                      'p-4 rounded-lg text-left transition-colors',
                      form.pricingTier === tier.id
                        ? 'bg-primary-500/20 border-2 border-primary-500'
                        : 'bg-surface-active border-2 border-transparent hover:border-gray-600'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium">{tier.name}</p>
                      <span className="text-primary-400 text-sm">{tier.multiplier}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{tier.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Conflict Warning */}
            {hasConflict && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-red-400 font-medium">Schedule Conflict Detected!</p>
                  <p className="text-red-300/70 text-sm mt-1">
                    The selected time slot overlaps with existing shows. Please go back and choose a different time.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="px-6 py-2.5 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || hasConflict}
            className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Create Show
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
