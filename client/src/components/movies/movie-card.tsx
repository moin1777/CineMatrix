'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Clock, Play } from 'lucide-react';
import type { Event } from '@/types';
import { formatDuration } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface MovieCardProps {
  movie: Event;
  index?: number;
}

export function MovieCard({ movie, index = 0 }: MovieCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <Link href={`/movies/${movie._id}`} className="block">
        <div className="card-hover overflow-hidden">
          {/* Poster */}
          <div className="relative aspect-[2/3] overflow-hidden">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Play button */}
            {movie.trailerUrl && (
              <motion.div
                initial={{ scale: 0 }}
                whileHover={{ scale: 1.1 }}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </motion.div>
            )}

            {/* Rating badge */}
            {movie.rating && (
              <div className="absolute top-2 left-2">
                <Badge variant="default" className="bg-black/60 backdrop-blur-sm">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
                  {movie.rating.toFixed(1)}
                </Badge>
              </div>
            )}

            {/* Certificate badge */}
            {movie.certificate && (
              <div className="absolute top-2 right-2">
                <Badge variant="default" className="bg-black/60 backdrop-blur-sm text-xs">
                  {movie.certificate}
                </Badge>
              </div>
            )}

            {/* Book Now button - visible on hover */}
            <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="btn-primary btn-sm w-full text-center">
                Book Now
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <h3 className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
              <span className="truncate">{movie.genre.slice(0, 2).join(', ')}</span>
              {movie.duration && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(movie.duration)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
