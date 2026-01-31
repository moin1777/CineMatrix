'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Calendar } from 'lucide-react';
import { api } from '@/lib/api-client';
import { MovieCarousel } from '@/components/movies/movie-carousel';
import { MovieCardSkeleton } from '@/components/ui/skeleton';
import type { Event } from '@/types';

// Mock upcoming data
const mockUpcoming: Event[] = [
  {
    _id: 'u1',
    title: 'Guardians of the Galaxy 4',
    description: '',
    category: 'movie',
    genre: ['Action', 'Sci-Fi', 'Comedy'],
    language: ['English'],
    duration: 145,
    releaseDate: '2026-03-15',
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400',
    cast: [],
    crew: [],
    certificate: 'UA',
    status: 'upcoming',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'u2',
    title: 'Black Panther 3',
    description: '',
    category: 'movie',
    genre: ['Action', 'Adventure'],
    language: ['English'],
    duration: 150,
    releaseDate: '2026-03-22',
    posterUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=400',
    cast: [],
    crew: [],
    certificate: 'UA',
    status: 'upcoming',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'u3',
    title: 'Thor 5',
    description: '',
    category: 'movie',
    genre: ['Action', 'Fantasy'],
    language: ['English'],
    duration: 140,
    releaseDate: '2026-04-01',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400',
    cast: [],
    crew: [],
    certificate: 'UA',
    status: 'upcoming',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'u4',
    title: 'Wonder Woman 3',
    description: '',
    category: 'movie',
    genre: ['Action', 'Fantasy'],
    language: ['English'],
    duration: 155,
    releaseDate: '2026-04-10',
    posterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=400',
    cast: [],
    crew: [],
    certificate: 'UA',
    status: 'upcoming',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'u5',
    title: 'Fast & Furious 12',
    description: '',
    category: 'movie',
    genre: ['Action', 'Thriller'],
    language: ['English'],
    duration: 135,
    releaseDate: '2026-04-15',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400',
    cast: [],
    crew: [],
    certificate: 'UA',
    status: 'upcoming',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'u6',
    title: 'Jurassic World 4',
    description: '',
    category: 'movie',
    genre: ['Action', 'Sci-Fi', 'Adventure'],
    language: ['English'],
    duration: 160,
    releaseDate: '2026-05-01',
    posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=400',
    cast: [],
    crew: [],
    certificate: 'UA',
    status: 'upcoming',
    createdAt: '',
    updatedAt: '',
  },
];

export function UpcomingSection() {
  const [movies, setMovies] = useState<Event[]>(mockUpcoming);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const response = await api.get<{ data: Event[] }>('/events?status=upcoming&limit=10');
        if (response.data.length > 0) {
          setMovies(response.data);
        }
      } catch {
        // Use mock data
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
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
          <Calendar className="w-5 h-5 text-primary-500" />
          <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
        </div>
        <Link
          href="/movies?status=upcoming"
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
