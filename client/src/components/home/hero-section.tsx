'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types';

// Mock featured movies for demo
const mockFeaturedMovies: Event[] = [
  {
    _id: '1',
    title: 'Dune: Part Three',
    description: 'The epic conclusion to the Dune saga as Paul Atreides leads the Fremen against the Emperor.',
    category: 'movie',
    genre: ['Sci-Fi', 'Adventure', 'Drama'],
    language: ['English'],
    duration: 165,
    releaseDate: '2026-01-15',
    posterUrl: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=1000',
    bannerUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070',
    cast: [],
    crew: [],
    rating: 9.2,
    certificate: 'UA',
    status: 'now_showing',
    featured: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '2',
    title: 'The Dark Knight Returns',
    description: 'An aging Bruce Wayne dons the cape and cowl once more to save Gotham from a new threat.',
    category: 'movie',
    genre: ['Action', 'Thriller', 'Drama'],
    language: ['English'],
    duration: 152,
    releaseDate: '2026-01-20',
    posterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=1000',
    bannerUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=2074',
    cast: [],
    crew: [],
    rating: 8.9,
    certificate: 'UA',
    status: 'now_showing',
    featured: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '3',
    title: 'Interstellar 2',
    description: 'A new mission beyond the stars as humanity faces its next great challenge.',
    category: 'movie',
    genre: ['Sci-Fi', 'Adventure'],
    language: ['English'],
    duration: 175,
    releaseDate: '2026-02-01',
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1000',
    bannerUrl: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413?q=80&w=2107',
    cast: [],
    crew: [],
    rating: 9.0,
    certificate: 'U',
    status: 'now_showing',
    featured: true,
    createdAt: '',
    updatedAt: '',
  },
];

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [featuredMovies, setFeaturedMovies] = useState<Event[]>(mockFeaturedMovies);

  useEffect(() => {
    // Try to fetch from API, fallback to mock data
    const fetchFeatured = async () => {
      try {
        const response = await api.get<{ data: Event[] }>('/events?featured=true&limit=5');
        if (response.data.length > 0) {
          setFeaturedMovies(response.data);
        }
      } catch {
        // Use mock data
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredMovies.length]);

  const currentMovie = featuredMovies[currentIndex];

  const goToSlide = (index: number) => setCurrentIndex(index);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);

  return (
    <section className="relative h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden">
      {/* Background Images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentMovie.bannerUrl || currentMovie.posterUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            {/* Badges */}
            <div className="flex items-center gap-3 mb-4">
              {currentMovie.rating && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-400 text-sm font-medium">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  {currentMovie.rating.toFixed(1)}
                </div>
              )}
              {currentMovie.certificate && (
                <span className="px-2 py-1 rounded-md bg-white/10 text-white text-sm">
                  {currentMovie.certificate}
                </span>
              )}
              <span className="px-2 py-1 rounded-md bg-primary-500/20 text-primary-400 text-sm">
                Now Showing
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {currentMovie.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-gray-300 mb-4">
              <span>{currentMovie.genre.slice(0, 3).join(' • ')}</span>
              {currentMovie.duration && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(currentMovie.duration)}
                  </span>
                </>
              )}
              <span>•</span>
              <span>{currentMovie.language.join(', ')}</span>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-lg mb-8 line-clamp-2">
              {currentMovie.description}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <Link href={`/movies/${currentMovie._id}`}>
                <Button size="lg" className="gap-2">
                  Book Tickets
                </Button>
              </Link>
              {currentMovie.trailerUrl && (
                <Button variant="secondary" size="lg" className="gap-2">
                  <Play className="w-5 h-5" />
                  Watch Trailer
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          onClick={prevSlide}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          {featuredMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-primary-500'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
        <button
          onClick={nextSlide}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
