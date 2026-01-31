'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from './movie-card';
import type { Event } from '@/types';

interface MovieCarouselProps {
  movies: Event[];
  title?: string;
}

export function MovieCarousel({ movies, title }: MovieCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group/carousel">
      {title && (
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      )}

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mb-4"
      >
        {movies.map((movie, index) => (
          <div
            key={movie._id}
            className="flex-shrink-0 w-[180px] sm:w-[200px] md:w-[220px]"
          >
            <MovieCard movie={movie} index={index} />
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black disabled:opacity-50 z-10"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black disabled:opacity-50 z-10"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Gradient Overlays */}
      <div className="absolute left-0 top-0 bottom-4 w-12 gradient-overlay-left pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
      <div className="absolute right-0 top-0 bottom-4 w-12 gradient-overlay-right pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
    </div>
  );
}
