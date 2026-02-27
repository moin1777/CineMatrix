'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Star,
  Clock,
  Calendar,
  Play,
  Share2,
  Heart,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { formatDuration, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Server event response interface (matches server model)
interface ServerEvent {
  _id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  posterUrl?: string;
  bannerUrl?: string;
  trailerUrl?: string;
  genre: string[];
  language?: string;
  rating?: string;
  releaseDate?: string;
  cast?: string[];
  director?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Normalized movie interface for UI
interface MovieData {
  _id: string;
  title: string;
  description: string;
  duration: number;
  posterUrl: string;
  bannerUrl?: string;
  trailerUrl?: string;
  genre: string[];
  language: string[];
  rating?: number;
  certificate?: string;
  releaseDate: string;
  cast: { name: string; role: string; imageUrl?: string }[];
  director?: string;
  status: 'upcoming' | 'now_showing' | 'ended';
}

// Server show response interface
interface ServerShow {
  _id: string;
  eventId: string;
  hallId: {
    _id: string;
    name: string;
    venueId: {
      _id: string;
      name: string;
      city: string;
    };
  };
  startTime: string;
  endTime: string;
  price: number;
  totalSeats: number;
  bookedSeats: string[];
}

interface VenueShowGroup {
  venue: {
    _id: string;
    name: string;
    city: string;
  };
  shows: ServerShow[];
}

// Helper function to transform server event to UI format
const transformEvent = (serverEvent: ServerEvent): MovieData => {
  return {
    _id: serverEvent._id,
    title: serverEvent.title,
    description: serverEvent.description || '',
    duration: serverEvent.durationMinutes,
    posterUrl: serverEvent.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80',
    bannerUrl: serverEvent.bannerUrl,
    trailerUrl: serverEvent.trailerUrl,
    genre: serverEvent.genre || [],
    language: serverEvent.language ? [serverEvent.language] : ['Hindi'],
    rating: serverEvent.rating ? parseFloat(serverEvent.rating) || undefined : undefined,
    certificate: serverEvent.rating,
    releaseDate: serverEvent.releaseDate || '',
    cast: (serverEvent.cast || []).map((name, index) => ({
      name,
      role: index === 0 ? 'Lead' : 'Supporting',
      imageUrl: `https://images.unsplash.com/photo-${1507003211169 + index}-0a1dd7228f2d?w=100`
    })),
    director: serverEvent.director,
    status: 'now_showing'
  };
};

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const movieId = params.id as string;

  const [movie, setMovie] = useState<MovieData | null>(null);
  const [venueShows, setVenueShows] = useState<VenueShowGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Generate date options (next 7 days)
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        // Fetch event data - server wraps response in { event }
        const eventResponse = await api.get<{ event: ServerEvent }>(`/events/${movieId}`);
        const serverEvent = eventResponse.event;
        
        if (serverEvent) {
          setMovie(transformEvent(serverEvent));
        }
      } catch (error) {
        console.error('Failed to fetch movie:', error);
        setMovie(null);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovie();
    }
  }, [movieId]);

  // Fetch shows when date changes
  useEffect(() => {
    const fetchShows = async () => {
      if (!movieId) return;
      
      try {
        const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const showsResponse = await api.get<{ shows: ServerShow[] }>(
          `/events/${movieId}/shows?date=${dateStr}`
        );
        
        // Group shows by venue
        const venueMap = new Map<string, VenueShowGroup>();
        
        for (const show of showsResponse.shows || []) {
          if (!show.hallId?.venueId) continue;
          
          const venueId = show.hallId.venueId._id;
          
          if (!venueMap.has(venueId)) {
            venueMap.set(venueId, {
              venue: show.hallId.venueId,
              shows: []
            });
          }
          
          venueMap.get(venueId)!.shows.push(show);
        }
        
        // Sort shows by start time within each venue
        const grouped = Array.from(venueMap.values());
        grouped.forEach(group => {
          group.shows.sort((a, b) => 
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
        });
        
        setVenueShows(grouped);
      } catch (error) {
        console.error('Failed to fetch shows:', error);
        setVenueShows([]);
      }
    };

    fetchShows();
  }, [movieId, selectedDate]);

  const formatShowTime = (time: string) => {
    return new Date(time).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getShowPrice = (show: ServerShow) => {
    return `₹${show.price || 150}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-[50vh] w-full" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            <Skeleton className="w-64 h-96 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Movie Not Found</h2>
          <Link href="/movies" className="text-primary-500 hover:text-primary-400">
            Browse all movies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-[50vh] min-h-[400px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${movie.bannerUrl || movie.posterUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative -mt-48 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-shrink-0"
            >
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-48 md:w-64 rounded-xl shadow-2xl mx-auto md:mx-0"
              />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 text-center md:text-left"
            >
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                {movie.rating && (
                  <Badge variant="success" className="gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {movie.rating.toFixed(1)}
                  </Badge>
                )}
                {movie.certificate && (
                  <Badge>{movie.certificate}</Badge>
                )}
                <Badge variant="info">
                  {movie.status === 'now_showing' ? 'Now Showing' : 'Coming Soon'}
                </Badge>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {movie.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-400 mb-6">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(movie.duration)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(movie.releaseDate)}
                </span>
                <span>{movie.genre.join(' • ')}</span>
              </div>

              {/* Languages */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
                {movie.language.map((lang) => (
                  <span
                    key={lang}
                    className="px-3 py-1 bg-surface-active rounded-full text-sm text-gray-300"
                  >
                    {lang}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8">
                {movie.trailerUrl && (
                  <Button variant="secondary" className="gap-2">
                    <Play className="w-4 h-4" />
                    Watch Trailer
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={cn('gap-2', isWishlisted && 'text-red-500')}
                >
                  <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
                  {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                </Button>
                <Button variant="ghost" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>

              {/* Description */}
              <p className="text-gray-300 leading-relaxed mb-8">
                {movie.description}
              </p>

              {/* Cast */}
              {movie.cast.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Cast</h3>
                  <div className="flex flex-wrap gap-4">
                    {movie.cast.slice(0, 6).map((member, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-surface-active overflow-hidden">
                          {member.imageUrl && (
                            <img
                              src={member.imageUrl}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{member.name}</p>
                          <p className="text-xs text-gray-400">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Shows Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Book Tickets</h2>

            {/* Date Selector */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-6">
              {dateOptions.map((date, index) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      'flex-shrink-0 px-4 py-3 rounded-xl text-center transition-all',
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface hover:bg-surface-hover text-gray-300'
                    )}
                  >
                    <p className="text-xs uppercase">
                      {index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </p>
                    <p className="text-lg font-semibold">{date.getDate()}</p>
                    <p className="text-xs">{date.toLocaleDateString('en-IN', { month: 'short' })}</p>
                  </button>
                );
              })}
            </div>

            {/* Venue Shows */}
            <div className="space-y-4">
              {venueShows.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="text-gray-400 mb-4">No shows available for this movie at the moment.</p>
                  <p className="text-sm text-gray-500">Please check back later or browse other movies.</p>
                </div>
              ) : (
                venueShows.map(({ venue, shows }) => (
                  <div key={venue._id} className="card p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white">{venue.name}</h3>
                        <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {venue.city}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {shows.map((show) => (
                        <Link
                          key={show._id}
                          href={`/book/${show._id}/seats`}
                        >
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-4 py-2 rounded-lg border border-primary-500 text-primary-400 hover:bg-primary-500/10 transition-colors"
                          >
                            <span className="font-medium">{formatShowTime(show.startTime)}</span>
                            <span className="text-xs text-gray-400 block">{getShowPrice(show)}</span>
                          </motion.button>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
