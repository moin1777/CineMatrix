'use client';

import { MovieCard } from './movie-card';
import { MovieGridSkeleton } from '@/components/ui/skeleton';
import type { Event } from '@/types';

interface MovieGridProps {
  movies: Event[];
  loading?: boolean;
  emptyMessage?: string;
}

export function MovieGrid({ movies, loading, emptyMessage = 'No movies found' }: MovieGridProps) {
  if (loading) {
    return <MovieGridSkeleton count={12} />;
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {movies.map((movie, index) => (
        <MovieCard key={movie._id} movie={movie} index={index} />
      ))}
    </div>
  );
}
