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
import type { Event, Show, Venue } from '@/types';

// Mock movie data
const mockMovie: Event = {
  _id: '1',
  title: 'Dune: Part Three',
  description:
    'The epic conclusion to the Dune saga as Paul Atreides leads the Fremen in a final battle against the Emperor. With ancient prophecies converging and the fate of the universe hanging in the balance, Paul must embrace his destiny while confronting the dark legacy of his bloodline.',
  category: 'movie',
  genre: ['Sci-Fi', 'Adventure', 'Drama', 'Action'],
  language: ['English', 'Hindi'],
  duration: 165,
  releaseDate: '2026-01-15',
  posterUrl: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=1000',
  bannerUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070',
  trailerUrl: 'https://youtube.com/watch?v=example',
  cast: [
    { name: 'Timothée Chalamet', role: 'Paul Atreides', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    { name: 'Zendaya', role: 'Chani', imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { name: 'Rebecca Ferguson', role: 'Lady Jessica', imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
    { name: 'Javier Bardem', role: 'Stilgar', imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' },
  ],
  crew: [
    { name: 'Denis Villeneuve', role: 'Director' },
    { name: 'Hans Zimmer', role: 'Music' },
  ],
  rating: 9.2,
  certificate: 'UA',
  status: 'now_showing',
  featured: true,
  createdAt: '',
  updatedAt: '',
};

// Mock shows data
const mockShows: { venue: Venue; shows: Show[] }[] = [
  {
    venue: {
      _id: 'v1',
      name: 'PVR IMAX',
      address: 'Phoenix Mall, Lower Parel',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400013',
      facilities: ['IMAX', 'Dolby Atmos', 'Recliner', 'F&B'],
      screens: [],
      createdAt: '',
      updatedAt: '',
    },
    shows: [
      {
        _id: 's1',
        event: '1',
        venue: 'v1',
        screen: 'Screen 1',
        showTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        endTime: '',
        pricing: [{ category: 'standard', price: 350 }],
        bookedSeats: [],
        status: 'scheduled',
        createdAt: '',
        updatedAt: '',
      },
      {
        _id: 's2',
        event: '1',
        venue: 'v1',
        screen: 'Screen 1',
        showTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        endTime: '',
        pricing: [{ category: 'standard', price: 400 }],
        bookedSeats: [],
        status: 'scheduled',
        createdAt: '',
        updatedAt: '',
      },
      {
        _id: 's3',
        event: '1',
        venue: 'v1',
        screen: 'Screen 1',
        showTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        endTime: '',
        pricing: [{ category: 'standard', price: 450 }],
        bookedSeats: [],
        status: 'scheduled',
        createdAt: '',
        updatedAt: '',
      },
    ],
  },
  {
    venue: {
      _id: 'v2',
      name: 'INOX Megaplex',
      address: 'R City Mall, Ghatkopar',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400086',
      facilities: ['Dolby Atmos', 'Luxe', 'F&B'],
      screens: [],
      createdAt: '',
      updatedAt: '',
    },
    shows: [
      {
        _id: 's4',
        event: '1',
        venue: 'v2',
        screen: 'Insignia',
        showTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        endTime: '',
        pricing: [{ category: 'standard', price: 300 }],
        bookedSeats: [],
        status: 'scheduled',
        createdAt: '',
        updatedAt: '',
      },
      {
        _id: 's5',
        event: '1',
        venue: 'v2',
        screen: 'Insignia',
        showTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        endTime: '',
        pricing: [{ category: 'standard', price: 350 }],
        bookedSeats: [],
        status: 'scheduled',
        createdAt: '',
        updatedAt: '',
      },
    ],
  },
];

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const movieId = params.id as string;

  const [movie, setMovie] = useState<Event | null>(null);
  const [venueShows, setVenueShows] = useState<typeof mockShows>([]);
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
      try {
        const [movieData, showsData] = await Promise.all([
          api.get<Event>(`/events/${movieId}`),
          api.get<typeof mockShows>(`/events/${movieId}/shows`),
        ]);
        setMovie(movieData);
        setVenueShows(showsData);
      } catch {
        // Use mock data
        setMovie(mockMovie);
        setVenueShows(mockShows);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

  const formatShowTime = (time: string) => {
    return new Date(time).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getShowPrice = (show: Show) => {
    const minPrice = Math.min(...show.pricing.map((p) => p.price));
    return `₹${minPrice}`;
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
              {venueShows.map(({ venue, shows }) => (
                <div key={venue._id} className="card p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{venue.name}</h3>
                      <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {venue.address}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {venue.facilities.slice(0, 3).map((facility) => (
                        <Badge key={facility} variant="default" size="sm">
                          {facility}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {shows.map((show) => (
                      <Link
                        key={show._id}
                        href={`/book/${show._id}/seats?eventId=${movie._id}&venueId=${venue._id}`}
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-4 py-2 rounded-lg border border-primary-500 text-primary-400 hover:bg-primary-500/10 transition-colors"
                        >
                          <span className="font-medium">{formatShowTime(show.showTime)}</span>
                          <span className="text-xs text-gray-400 block">{getShowPrice(show)}</span>
                        </motion.button>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
