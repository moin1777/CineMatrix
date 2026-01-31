'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { MovieCarousel } from '@/components/movies/movie-carousel';
import { MovieCardSkeleton } from '@/components/ui/skeleton';
import type { Event } from '@/types';

// Mock data for demo
const mockNowShowing: Event[] = [
  {
    _id: '1',
    title: 'Dune: Part Three',
    description: '',
    category: 'movie',
    genre: ['Sci-Fi', 'Adventure'],
    language: ['English'],
    duration: 165,
    releaseDate: '2026-01-15',
    posterUrl: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=400',
    cast: [],
    crew: [],
    rating: 9.2,
    certificate: 'UA',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '2',
    title: 'The Dark Knight Returns',
    description: '',
    category: 'movie',
    genre: ['Action', 'Thriller'],
    language: ['English'],
    duration: 152,
    releaseDate: '2026-01-20',
    posterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=400',
    cast: [],
    crew: [],
    rating: 8.9,
    certificate: 'UA',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '3',
    title: 'Interstellar 2',
    description: '',
    category: 'movie',
    genre: ['Sci-Fi', 'Adventure'],
    language: ['English'],
    duration: 175,
    releaseDate: '2026-02-01',
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=400',
    cast: [],
    crew: [],
    rating: 9.0,
    certificate: 'U',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '4',
    title: 'Avatar 4',
    description: '',
    category: 'movie',
    genre: ['Sci-Fi', 'Fantasy'],
    language: ['English'],
    duration: 180,
    releaseDate: '2026-01-25',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400',
    cast: [],
    crew: [],
    rating: 8.5,
    certificate: 'UA',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '5',
    title: 'Mission Impossible 9',
    description: '',
    category: 'movie',
    genre: ['Action', 'Thriller'],
    language: ['English'],
    duration: 145,
    releaseDate: '2026-01-28',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400',
    cast: [],
    crew: [],
    rating: 8.7,
    certificate: 'UA',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '6',
    title: 'The Matrix 5',
    description: '',
    category: 'movie',
    genre: ['Sci-Fi', 'Action'],
    language: ['English'],
    duration: 140,
    releaseDate: '2026-02-05',
    posterUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=400',
    cast: [],
    crew: [],
    rating: 8.3,
    certificate: 'UA',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '7',
    title: 'Oppenheimer 2',
    description: '',
    category: 'movie',
    genre: ['Drama', 'History'],
    language: ['English'],
    duration: 180,
    releaseDate: '2026-02-10',
    posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=400',
    cast: [],
    crew: [],
    rating: 8.8,
    certificate: 'A',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '8',
    title: 'Spider-Man: Beyond',
    description: '',
    category: 'movie',
    genre: ['Action', 'Superhero'],
    language: ['English'],
    duration: 135,
    releaseDate: '2026-02-15',
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=400',
    cast: [],
    crew: [],
    rating: 8.6,
    certificate: 'U',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
];

export function NowShowingSection() {
  const [movies, setMovies] = useState<Event[]>(mockNowShowing);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await api.get<{ data: Event[] }>('/events?status=now_showing&limit=10');
        if (response.data.length > 0) {
          setMovies(response.data);
        }
      } catch {
        // Use mock data
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

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Now Showing</h2>
        <Link
          href="/movies?status=now_showing"
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
