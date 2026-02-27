'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ArrowLeft,
  Wifi,
  Car,
  Utensils,
  Accessibility,
  CreditCard,
  Armchair,
  Building2
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Hall {
  _id: string;
  name: string;
  capacity: number;
  screenType: string;
  soundSystem: string;
  features: string[];
}

interface Venue {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  amenities: string[];
  halls: Hall[];
  isActive: boolean;
}

const amenityIcons: Record<string, React.ReactNode> = {
  'Parking': <Car className="w-5 h-5" />,
  'Food Court': <Utensils className="w-5 h-5" />,
  'Wheelchair Access': <Accessibility className="w-5 h-5" />,
  'Card Payment': <CreditCard className="w-5 h-5" />,
  'Recliner Seats': <Armchair className="w-5 h-5" />,
  'WiFi': <Wifi className="w-5 h-5" />,
};

export default function VenueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ venue: Venue }>(`/venues/${params.id}`);
        setVenue(response.venue);
      } catch (err: any) {
        setError(err.message || 'Failed to load venue');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchVenue();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-800 rounded w-1/2 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-48 bg-gray-800 rounded-xl" />
                <div className="h-64 bg-gray-800 rounded-xl" />
              </div>
              <div className="h-80 bg-gray-800 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Venue Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The venue you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/venues')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Venues
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{venue.name}</h1>
              <div className="flex items-center text-gray-400">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{venue.address}, {venue.city}, {venue.state} - {venue.pincode}</span>
              </div>
            </div>
            <Badge variant={venue.isActive ? 'default' : 'destructive'} className="text-sm">
              {venue.isActive ? 'Open' : 'Closed'}
            </Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Amenities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900/50 rounded-xl p-6 border border-gray-800"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {venue.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3"
                  >
                    <div className="text-red-500">
                      {amenityIcons[amenity] || <Building2 className="w-5 h-5" />}
                    </div>
                    <span className="text-gray-300 text-sm">{amenity}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Halls/Screens */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900/50 rounded-xl p-6 border border-gray-800"
            >
              <h2 className="text-xl font-semibold text-white mb-4">
                Screens ({venue.halls?.length || 0})
              </h2>
              <div className="space-y-4">
                {venue.halls?.map((hall) => (
                  <div
                    key={hall._id}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-white">{hall.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {hall.capacity} seats
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {hall.screenType}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {hall.soundSystem}
                      </Badge>
                    </div>
                    {hall.features && hall.features.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {hall.features.map((feature) => (
                          <span
                            key={feature}
                            className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
              <div className="space-y-4">
                <a
                  href={`tel:${venue.phone}`}
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p>{venue.phone}</p>
                  </div>
                </a>
                <a
                  href={`mailto:${venue.email}`}
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="break-all">{venue.email}</p>
                  </div>
                </a>
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hours</p>
                    <p>9:00 AM - 11:30 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => router.push('/movies')}
                >
                  Browse Movies
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(venue.address + ', ' + venue.city)}`, '_blank')}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
