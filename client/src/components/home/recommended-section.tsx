'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { MovieCarousel } from '@/components/movies/movie-carousel';
import { MovieCardSkeleton } from '@/components/ui/skeleton';
import type { Event } from '@/types';

// Mock recommended data
const mockRecommended: Event[] = [
  {
    _id: 'r1',
    title: 'Blade Runner 2099',
    description: '',
    category: 'movie',
    genre: ['Sci-Fi', 'Thriller'],
    language: ['English'],
    duration: 155,
    releaseDate: '2026-01-15',
    posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=400',
    cast: [],
    crew: [],
    rating: 8.8,
    certificate: 'UA',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'r2',
    title: 'Inception 2',
    description: '',
    category: 'movie',
    genre: ['Sci-Fi', 'Thriller'],
    language: ['English'],
    duration: 160,
    releaseDate: '2026-01-22',
    posterUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=400',
    cast: [],
    crew: [],
    rating: 9.1,
    certificate: 'UA',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'r3',
    title: 'Tenet 2',
    description: '',
    category: 'movie',
    genre: ['Sci-Fi', 'Action'],
    language: ['English'],
    duration: 150,
    releaseDate: '2026-02-01',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400',
    cast: [],
    crew: [],
    rating: 8.4,
    certificate: 'UA',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'r4',
    title: 'Gravity 2',
    description: '',
    category: 'movie',
    genre: ['Sci-Fi', 'Thriller'],
    language: ['English'],
    duration: 120,
    releaseDate: '2026-02-10',
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=400',
    cast: [],
    crew: [],
    rating: 8.2,
    certificate: 'U',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'r5',
    title: 'Arrival 2',
    description: '',
    category: 'movie',
    genre: ['Sci-Fi', 'Drama'],
    language: ['English'],
    duration: 130,
    releaseDate: '2026-02-15',
    posterUrl: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413?q=80&w=400',
    cast: [],
    crew: [],
    rating: 8.6,
    certificate: 'U',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'r6',
    title: 'Ex Machina 2',
    description: '',
    category: 'movie',
    genre: ['Sci-Fi', 'Thriller'],
    language: ['English'],
    duration: 115,
    releaseDate: '2026-02-20',
    posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400',
    cast: [],
    crew: [],
    rating: 8.3,
    certificate: 'A',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
];

export function RecommendedSection() {
  const { isAuthenticated } = useAuth();
  const [movies, setMovies] = useState<Event[]>(mockRecommended);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const endpoint = isAuthenticated ? '/events/recommended' : '/events?limit=8';
        const response = await api.get<{ data: Event[] }>(endpoint);
        if (response.data && response.data.length > 0) {
          setMovies(response.data);
        }
      } catch {
        // Use mock data
      } finally {
        setLoading(false);
      }
    };
    fetchRecommended();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <h2 className="text-2xl font-bold text-white">Recommended for You</h2>
          </div>
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

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <h2 className="text-2xl font-bold text-white">
            {isAuthenticated ? 'Recommended for You' : 'Popular Movies'}
          </h2>
        </div>
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
