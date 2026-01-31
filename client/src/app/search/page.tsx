'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, X, Film, MapPin, Calendar, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { MovieCardSkeleton } from '@/components/ui/skeleton';
import type { Event } from '@/types';

// Mock search results
const mockResults: Event[] = [
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
];

const trendingSearches = [
  'Dune',
  'Batman',
  'Avengers',
  'Spider-Man',
  'Mission Impossible',
  'Fast & Furious',
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);

      try {
        const response = await api.get<{ data: Event[] }>(`/events?query=${encodeURIComponent(query)}`);
        setResults(response.data);
      } catch {
        // Filter mock data
        const filtered = mockResults.filter((m) =>
          m.title.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [query]);

  const handleTrendingClick = (term: string) => {
    setQuery(term);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Search Input */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for movies, events, venues..."
              className="w-full pl-12 pr-12 py-4 rounded-xl bg-surface border border-border text-white text-lg placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-500 hover:text-white hover:bg-surface-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Trending Searches */}
        {!hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Trending Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleTrendingClick(term)}
                  className="px-4 py-2 rounded-full bg-surface text-gray-300 text-sm hover:bg-surface-hover transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl bg-surface animate-pulse">
                <div className="w-20 h-28 rounded-lg bg-surface-active" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-surface-active rounded" />
                  <div className="h-4 w-1/2 bg-surface-active rounded" />
                  <div className="h-4 w-1/4 bg-surface-active rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && hasSearched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {results.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">
                  No results found
                </h2>
                <p className="text-gray-400">
                  Try searching for something else
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                </p>
                {results.map((movie, index) => (
                  <motion.div
                    key={movie._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={`/movies/${movie._id}`}
                      className="flex gap-4 p-4 rounded-xl bg-surface hover:bg-surface-hover transition-colors"
                    >
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-20 h-28 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-white truncate">
                            {movie.title}
                          </h3>
                          {movie.rating && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 text-xs">
                              ★ {movie.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {movie.genre.join(' • ')}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Film className="w-3 h-3" />
                            {movie.category}
                          </span>
                          <span>{movie.language.join(', ')}</span>
                          {movie.certificate && (
                            <span className="px-1.5 py-0.5 rounded bg-surface-active">
                              {movie.certificate}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
