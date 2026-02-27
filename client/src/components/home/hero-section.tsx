'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  bannerUrl: e.bannerUrl || e.posterUrl,
  cast: (e.cast || []).map(name => ({ name, role: '' })),
  crew: e.director ? [{ name: e.director, role: 'Director' }] : [],
  rating: e.rating ? parseFloat(e.rating) || undefined : undefined,
  certificate: e.rating,
  status: 'now_showing',
  featured: true,
  createdAt: '',
  updatedAt: '',
});

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [featuredMovies, setFeaturedMovies] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await api.get<{ events: ServerEvent[]; total: number }>('/events?limit=5');
        if (response.events && response.events.length > 0) {
          setFeaturedMovies(response.events.map(transformEvent));
        }
      } catch (error) {
        console.error('Failed to fetch featured movies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (featuredMovies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredMovies.length]);

  if (loading || featuredMovies.length === 0) {
    return (
      <section className="relative h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden bg-gradient-to-b from-surface to-background">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Loading featured movies...</div>
        </div>
      </section>
    );
  }

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
                  {typeof currentMovie.rating === 'number' ? currentMovie.rating.toFixed(1) : currentMovie.rating}
                </div>
              )}
              {currentMovie.certificate && (
                <span className="px-2 py-1 rounded-md bg-white/10 text-white text-sm">
                  {currentMovie.certificate}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {currentMovie.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 text-gray-300 mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(currentMovie.duration)}
              </span>
              <span>{currentMovie.genre.slice(0, 3).join(' • ')}</span>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-lg mb-6 line-clamp-2">
              {currentMovie.description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Link href={`/movies/${currentMovie._id}`}>
                <Button size="lg" className="gap-2">
                  <Play className="w-5 h-5" />
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

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          onClick={prevSlide}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2">
          {featuredMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-primary-500'
                  : 'w-2 bg-white/30 hover:bg-white/50'
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
