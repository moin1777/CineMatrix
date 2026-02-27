'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { api } from '@/lib/api-client';
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

export function NowShowingSection() {
  const [movies, setMovies] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await api.get<{ events: ServerEvent[]; total: number }>('/events?limit=10');
        if (response.events && response.events.length > 0) {
          setMovies(response.events.map(transformEvent));
        }
      } catch (error) {
        console.error('Failed to fetch movies:', error);
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
          <h2 className="text-2xl font-bold text-white">Now Showing</h2>
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
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Now Showing</h2>
        </div>
        <p className="text-gray-400">No movies available at the moment.</p>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Now Showing</h2>
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
