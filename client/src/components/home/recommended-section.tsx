'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { MovieCarousel } from '@/components/movies/movie-carousel';
import { MovieCardSkeleton } from '@/components/ui/skeleton';
import type { Event } from '@/types';

// Server response interface
interface ServerEvent {
  _id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  posterUrl?: string;
  bannerUrl?: string;
  genre: string[];
  language?: string;
  rating?: string;
  releaseDate?: string;
  cast?: string[];
  director?: string;
  isActive: boolean;
}

// Transform server event to client Event type
const transformEvent = (e: ServerEvent): Event => ({
  _id: e._id,
  title: e.title,
  description: e.description || '',
  category: 'movie',
  genre: e.genre || [],
  language: e.language ? [e.language] : ['Hindi'],
  duration: e.durationMinutes,
  releaseDate: e.releaseDate || '',
  posterUrl: e.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80',
  bannerUrl: e.bannerUrl,
  cast: (e.cast || []).map(name => ({ name, role: '' })),
  crew: e.director ? [{ name: e.director, role: 'Director' }] : [],
  rating: e.rating ? parseFloat(e.rating) || undefined : undefined,
  certificate: e.rating,
  status: 'now_showing',
  createdAt: '',
  updatedAt: '',
});

export function RecommendedSection() {
  const { isAuthenticated } = useAuth();
  const [movies, setMovies] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        // Fetch movies - in the future this could be personalized based on user preferences
        const response = await api.get<{ events: ServerEvent[]; total: number }>('/events?limit=8');
        if (response.events && response.events.length > 0) {
          // Shuffle to show variety
          const shuffled = response.events.sort(() => Math.random() - 0.5);
          setMovies(shuffled.map(transformEvent));
        }
      } catch (error) {
        console.error('Failed to fetch recommended movies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-500" />
            Recommended for You
          </h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[200px]">
              <MovieCardSkeleton />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (movies.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary-500" />
          Recommended for You
        </h2>
        <Link
          href="/movies"
          className="flex items-center gap-1 text-primary-500 hover:text-primary-400 transition-colors text-sm font-medium"
        >
          See All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <MovieCarousel movies={movies} />
    </section>
  );
}
