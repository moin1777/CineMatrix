'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Star, Film, Filter } from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ServerVenue {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

interface ServerHall {
  _id: string;
  venueId: string;
  name: string;
  capacity: number;
  amenities: string[];
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<ServerVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('all');

  const cities = ['all', 'Ahmedabad', 'Gandhinagar'];

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        let url = '/venues';
        if (selectedCity !== 'all') url += `?city=${selectedCity}`;
        
        const response = await api.get<{ venues: ServerVenue[] }>(url);
        if (response.venues) {
          setVenues(response.venues);
        }
      } catch (error) {
        console.error('Failed to fetch venues:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, [selectedCity]);

  // Helper to get amenities (in a real app, we'd fetch halls too)
  const getVenueAmenities = (venueName: string): string[] => {
    if (venueName.includes('IMAX')) return ['IMAX', 'Dolby Atmos', 'Recliner Seats', '4K Laser'];
    if (venueName.includes('PVR')) return ['Dolby Atmos', '4DX', 'Premium Loungers'];
    if (venueName.includes('INOX')) return ['Dolby Digital', 'INSIGNIA', 'MX4D'];
    if (venueName.includes('Cinepolis')) return ['4DX', 'VIP Seats', 'Dolby Atmos'];
    return ['Dolby Digital', 'Stadium Seating', 'F&B'];
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Venues</h1>
          <p className="text-gray-400">Find cinemas near you in Ahmedabad & Gandhinagar</p>
        </div>

        {/* City Filter */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">City:</span>
            <div className="flex gap-2">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    selectedCity === city
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface hover:bg-surface-hover text-gray-300'
                  )}
                >
                  {city === 'all' ? 'All Cities' : city}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Venues Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No venues found in this city.</p>
            <Button 
              variant="secondary" 
              className="mt-4"
              onClick={() => setSelectedCity('all')}
            >
              Show All Venues
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue, index) => (
              <motion.div
                key={venue._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card p-6 hover:ring-2 hover:ring-primary-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{venue.name}</h3>
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {venue.address}
                    </p>
                  </div>
                  <Badge variant="success" size="sm">
                    <Film className="w-3 h-3 mr-1" />
                    Open
                  </Badge>
                </div>

                <div className="text-sm text-gray-400 mb-4">
                  <p>{venue.city}, {venue.state} - {venue.zipCode}</p>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {getVenueAmenities(venue.name).slice(0, 4).map((amenity) => (
                    <Badge key={amenity} variant="default" size="sm">
                      {amenity}
                    </Badge>
                  ))}
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-sm text-gray-400 mb-4">
                  {venue.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {venue.phone}
                    </p>
                  )}
                  {venue.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {venue.email}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href="/movies" className="flex-1">
                    <Button variant="secondary" className="w-full">
                      View Shows
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="w-auto">
                    <Star className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Map Section Placeholder */}
        <div className="mt-12 card p-8 text-center">
          <MapPin className="w-12 h-12 text-primary-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Find Nearby Cinemas</h3>
          <p className="text-gray-400 mb-4">
            We have {venues.length} venues across Ahmedabad and Gandhinagar
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-sm">
            <div className="bg-surface p-4 rounded-lg">
              <p className="text-2xl font-bold text-primary-500">
                {venues.filter(v => v.city === 'Ahmedabad').length}
              </p>
              <p className="text-gray-400">Ahmedabad</p>
            </div>
            <div className="bg-surface p-4 rounded-lg">
              <p className="text-2xl font-bold text-primary-500">
                {venues.filter(v => v.city === 'Gandhinagar').length}
              </p>
              <p className="text-gray-400">Gandhinagar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
