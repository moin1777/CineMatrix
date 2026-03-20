'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';

interface AdminMovie {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  posterUrl?: string;
  language?: string;
  genre: string[];
  rating?: string;
  releaseDate?: string;
  isActive: boolean;
  totalShows: number;
  upcomingShows: number;
  bookings: number;
  revenue: number;
}

interface MoviesResponse {
  items: AdminMovie[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    total: number;
    active: number;
    inactive: number;
    upcomingShows: number;
    activeHalls: number;
  };
}

const formatCurrency = (value: number) => `₹${new Intl.NumberFormat('en-IN').format(Math.round(value))}`;

export default function AdminMoviesPage() {
  const { isAuthenticated, isLoading } = useAuth();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MoviesResponse | null>(null);

  const loadMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<MoviesResponse>(
        `/admin/movies?page=${page}&limit=12&status=${status}&search=${encodeURIComponent(search)}`
      );
      setData(response);
    } catch (err: any) {
      setError(err?.message || 'Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    loadMovies();
  }, [isLoading, isAuthenticated, page, status]);

  const onSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    loadMovies();
  };

  const onToggleStatus = async (movie: AdminMovie) => {
    setUpdatingId(movie.id);
    try {
      await api.patch(`/admin/movies/${movie.id}/status`, { isActive: !movie.isActive });
      await loadMovies();
    } catch (err: any) {
      setError(err?.message || 'Failed to update movie status');
    } finally {
      setUpdatingId(null);
    }
  };

  const movies = useMemo(() => data?.items || [], [data]);

  if (isLoading || loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-52 bg-surface-active rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-56 bg-surface-card border border-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Movies & Events</h1>
          <p className="text-gray-400">Manage catalog status, performance and release slate.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-surface-card border border-gray-800 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-white font-semibold">{data?.summary.total || 0}</p>
          </div>
          <div className="bg-surface-card border border-gray-800 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-green-400 font-semibold">{data?.summary.active || 0}</p>
          </div>
          <div className="bg-surface-card border border-gray-800 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500">Upcoming Shows</p>
            <p className="text-primary-400 font-semibold">{data?.summary.upcomingShows || 0}</p>
          </div>
          <div className="bg-surface-card border border-gray-800 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-500">Active Halls</p>
            <p className="text-white font-semibold">{data?.summary.activeHalls || 0}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={onSearchSubmit} className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search movies by title or description"
            className="w-full pl-10 pr-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </form>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as 'all' | 'active' | 'inactive');
            setPage(1);
          }}
          className="px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          onClick={loadMovies}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {movies.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3 bg-surface-card border border-gray-800 rounded-xl p-6 text-center text-gray-500">
            No movies/events found.
          </div>
        )}

        {movies.map((movie) => (
          <div key={movie.id} className="bg-surface-card border border-gray-800 rounded-xl overflow-hidden">
            <div className="h-44 bg-surface-active relative">
              {movie.posterUrl ? (
                <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">No poster</div>
              )}
              <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${movie.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-300'}`}>
                {movie.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-white font-semibold line-clamp-1">{movie.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mt-1">{movie.description || 'No description available.'}</p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {(movie.genre || []).slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded bg-primary-500/10 text-primary-300 border border-primary-500/20">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-surface-active rounded p-2">
                  <p className="text-gray-500 text-xs">Language</p>
                  <p className="text-white">{movie.language || 'N/A'}</p>
                </div>
                <div className="bg-surface-active rounded p-2">
                  <p className="text-gray-500 text-xs">Duration</p>
                  <p className="text-white">{movie.durationMinutes} min</p>
                </div>
                <div className="bg-surface-active rounded p-2">
                  <p className="text-gray-500 text-xs">Bookings</p>
                  <p className="text-white">{movie.bookings}</p>
                </div>
                <div className="bg-surface-active rounded p-2">
                  <p className="text-gray-500 text-xs">Revenue</p>
                  <p className="text-white">{formatCurrency(movie.revenue)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Shows: {movie.totalShows}</span>
                <span>Upcoming: {movie.upcomingShows}</span>
              </div>

              <button
                onClick={() => onToggleStatus(movie)}
                disabled={updatingId === movie.id}
                className={`w-full py-2 rounded-lg transition-colors ${movie.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
              >
                {updatingId === movie.id
                  ? 'Updating...'
                  : movie.isActive
                  ? 'Deactivate'
                  : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="px-3 py-1.5 rounded border border-gray-700 text-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {data.pagination.page} of {data.pagination.pages}
          </span>
          <button
            disabled={page >= data.pagination.pages}
            onClick={() => setPage((prev) => Math.min(data.pagination.pages, prev + 1))}
            className="px-3 py-1.5 rounded border border-gray-700 text-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
