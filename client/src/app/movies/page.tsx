'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api-client';
import { MovieGrid } from '@/components/movies/movie-grid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Event, PaginatedResponse } from '@/types';

const genres = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
];

const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali'];

// Mock movies data
const mockMovies: Event[] = [
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
  {
    _id: '9',
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
    _id: '10',
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
    _id: '11',
    title: 'John Wick 5',
    description: '',
    category: 'movie',
    genre: ['Action', 'Crime'],
    language: ['English'],
    duration: 130,
    releaseDate: '2026-02-20',
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400',
    cast: [],
    crew: [],
    rating: 8.5,
    certificate: 'A',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '12',
    title: 'Top Gun 3',
    description: '',
    category: 'movie',
    genre: ['Action', 'Drama'],
    language: ['English'],
    duration: 145,
    releaseDate: '2026-02-25',
    posterUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=400',
    cast: [],
    crew: [],
    rating: 8.7,
    certificate: 'UA',
    status: 'now_showing',
    createdAt: '',
    updatedAt: '',
  },
];

export default function MoviesPage() {
  const searchParams = useSearchParams();

  const [movies, setMovies] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('query', searchQuery);
        if (selectedGenres.length) params.set('genre', selectedGenres.join(','));
        if (selectedLanguages.length) params.set('language', selectedLanguages.join(','));

        const response = await api.get<PaginatedResponse<Event>>(
          `/events?${params.toString()}`
        );
        setMovies(response.data);
      } catch {
        // Filter mock data based on filters
        let filtered = [...mockMovies];

        if (searchQuery) {
          filtered = filtered.filter((m) =>
            m.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        if (selectedGenres.length) {
          filtered = filtered.filter((m) =>
            m.genre.some((g) => selectedGenres.includes(g))
          );
        }

        if (selectedLanguages.length) {
          filtered = filtered.filter((m) =>
            m.language.some((l) => selectedLanguages.includes(l))
          );
        }

        setMovies(filtered);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [searchQuery, selectedGenres, selectedLanguages]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleLanguage = (language: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    );
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedLanguages([]);
    setSearchQuery('');
  };

  const hasFilters = selectedGenres.length > 0 || selectedLanguages.length > 0 || searchQuery;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Movies</h1>
          <p className="text-gray-400">Browse and book tickets for the latest movies</p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasFilters && (
                <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
                  {selectedGenres.length + selectedLanguages.length + (searchQuery ? 1 : 0)}
                </span>
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card p-4 space-y-4"
            >
              {/* Genres */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedGenres.includes(genre)
                          ? 'bg-primary-500 text-white'
                          : 'bg-surface-active text-gray-300 hover:bg-surface-hover'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {languages.map((language) => (
                    <button
                      key={language}
                      onClick={() => toggleLanguage(language)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedLanguages.includes(language)
                          ? 'bg-primary-500 text-white'
                          : 'bg-surface-active text-gray-300 hover:bg-surface-hover'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {/* Movies Grid */}
        <MovieGrid
          movies={movies}
          loading={loading}
          emptyMessage={
            hasFilters
              ? 'No movies match your filters. Try adjusting your search.'
              : 'No movies available at the moment.'
          }
        />
      </div>
    </div>
  );
}
