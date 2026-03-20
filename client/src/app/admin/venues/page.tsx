'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

// ============================================================================
// TYPES
// ============================================================================

interface Venue {
  _id: string;
  name: string;
  city: string;
  address: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  // Optionally add more fields as needed
}

// ============================================================================
// VENUE CARD COMPONENT
// ============================================================================

const VenueCard: React.FC<{ venue: Venue }> = ({ venue }) => {
  const statusColor = venue.isActive
    ? 'bg-green-500/10 text-green-400 border-green-500/20'
    : 'bg-gray-500/10 text-gray-400 border-gray-500/20';

  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 p-6 hover:border-primary-500/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{venue.name}</h3>
          <p className="text-gray-400 text-sm">{venue.city}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
          {venue.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{venue.address}</p>

      {/* Optionally add more venue info here if available */}

      <div className="flex items-center gap-2">
        <Link
          href={`/admin/venues/${venue._id}`}
          className="flex-1 text-center py-2 bg-surface-active rounded-lg text-sm text-white hover:bg-gray-700 transition-colors"
        >
          View Details
        </Link>
        <Link
          href={`/admin/venues/${venue._id}/seats`}
          className="flex-1 text-center py-2 bg-primary-500/10 rounded-lg text-sm text-primary-400 hover:bg-primary-500/20 transition-colors"
        >
          Edit Seats
        </Link>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================


export default function VenuesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      try {
        const response = await api.get<{ venues: Venue[] }>('/venues');
        setVenues(response.venues || []);
      } catch (err) {
        setVenues([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);

  const cities = useMemo(() => 
    Array.from(new Set(venues.map(v => v.city))),
    [venues]
  );

  const filteredVenues = useMemo(() => {
    return venues.filter(venue => {
      const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           venue.city.toLowerCase().includes(searchQuery.toLowerCase());
      // Only show active/inactive/maintenance if you have such a field, otherwise show all
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? venue.isActive : !venue.isActive);
      const matchesCity = cityFilter === 'all' || venue.city === cityFilter;
      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [venues, searchQuery, statusFilter, cityFilter]);

  const stats = {
    total: venues.length,
    active: venues.filter(v => v.isActive).length,
    // You may want to fetch screens/capacity from halls if needed
    totalScreens: 0,
    totalCapacity: 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Venues & Inventory</h1>
          <p className="text-gray-400">Manage your cinema locations and seat layouts</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/venues/seat-builder"
            className="px-4 py-2 border border-primary-500 text-primary-400 rounded-lg hover:bg-primary-500/10 transition-colors"
          >
            Seat Map Builder
          </Link>
          <Link
            href="/admin/venues/create"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Venue
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Total Venues</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Active Venues</p>
          <p className="text-2xl font-bold text-green-400">{stats.active}</p>
        </div>
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Total Screens</p>
          <p className="text-2xl font-bold text-white">{stats.totalScreens}</p>
        </div>
        <div className="bg-surface-card rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Total Capacity</p>
          <p className="text-2xl font-bold text-white">{stats.totalCapacity.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
        >
          <option value="all">All Cities</option>
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-400">Loading venues...</div>
        ) : filteredVenues.length > 0 ? (
          filteredVenues.map(venue => (
            <VenueCard key={venue._id} venue={venue} />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-400">No venues found.</div>
        )}
      </div>

    </div>
  );
}
