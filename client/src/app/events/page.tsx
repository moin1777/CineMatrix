'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Clock, Calendar, Filter } from 'lucide-react';
import { api } from '@/lib/api-client';
import { formatDuration, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ServerEvent {
  _id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  posterUrl?: string;
  genre: string[];
  language?: string;
  rating?: string;
  releaseDate?: string;
  director?: string;
  cast?: string[];
  isActive: boolean;
}

export default function EventsPage() {
  const [events, setEvents] = useState<ServerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  const genres = ['all', 'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller'];
  const languages = ['all', 'Hindi', 'English', 'Telugu', 'Tamil'];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        let url = '/events?limit=50';
        if (selectedGenre !== 'all') url += `&genre=${selectedGenre}`;
        if (selectedLanguage !== 'all') url += `&language=${selectedLanguage}`;
        
        const response = await api.get<{ events: ServerEvent[]; total: number }>(url);
        if (response.events) {
          setEvents(response.events);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [selectedGenre, selectedLanguage]);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">All Events</h1>
          <p className="text-gray-400">Browse all movies and events</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Genre:</span>
            <div className="flex gap-2">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm transition-colors',
                    selectedGenre === genre
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface hover:bg-surface-hover text-gray-300'
                  )}
                >
                  {genre === 'all' ? 'All' : genre}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Language:</span>
            <div className="flex gap-2">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm transition-colors',
                    selectedLanguage === lang
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface hover:bg-surface-hover text-gray-300'
                  )}
                >
                  {lang === 'all' ? 'All' : lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No events found matching your criteria.</p>
            <Button 
              variant="secondary" 
              className="mt-4"
              onClick={() => { setSelectedGenre('all'); setSelectedLanguage('all'); }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {events.map((event, index) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/movies/${event._id}`}>
                  <div className="group relative overflow-hidden rounded-xl bg-surface hover:ring-2 hover:ring-primary-500 transition-all">
                    <div className="aspect-[2/3] overflow-hidden">
                      <img
                        src={event.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80'}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <Button size="sm" className="w-full">Book Now</Button>
                      </div>
                    </div>

                    {/* Rating Badge */}
                    {event.rating && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-yellow-400 text-xs font-medium">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        {event.rating}
                      </div>
                    )}

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-white truncate">{event.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{event.genre?.slice(0, 2).join(', ')}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(event.durationMinutes)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {event.language}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
