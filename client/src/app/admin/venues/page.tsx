'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface Venue {
  id: string;
  name: string;
  city: string;
  address: string;
  screens: number;
  totalCapacity: number;
  activeShows: number;
  status: 'active' | 'inactive' | 'maintenance';
}

// ============================================================================
// VENUE CARD COMPONENT
// ============================================================================

const VenueCard: React.FC<{ venue: Venue }> = ({ venue }) => {
  const statusColors = {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    inactive: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    maintenance: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };

  return (
    <div className="bg-surface-card rounded-xl border border-gray-800 p-6 hover:border-primary-500/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{venue.name}</h3>
          <p className="text-gray-400 text-sm">{venue.city}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[venue.status]}`}>
          {venue.status.charAt(0).toUpperCase() + venue.status.slice(1)}
        </span>
      </div>
      
      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{venue.address}</p>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{venue.screens}</p>
          <p className="text-xs text-gray-500">Screens</p>
        </div>
        <div className="text-center border-x border-gray-700">
          <p className="text-2xl font-bold text-white">{venue.totalCapacity}</p>
          <p className="text-xs text-gray-500">Total Seats</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-400">{venue.activeShows}</p>
          <p className="text-xs text-gray-500">Active Shows</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/venues/${venue.id}`}
          className="flex-1 text-center py-2 bg-surface-active rounded-lg text-sm text-white hover:bg-gray-700 transition-colors"
        >
          View Details
        </Link>
        <Link
          href={`/admin/venues/${venue.id}/seats`}
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

  // Mock data
  const venues: Venue[] = [
    {
      id: '1',
      name: 'PVR Cinemas',
      city: 'Hyderabad',
      address: 'Inorbit Mall, Mindspace, Hitec City',
      screens: 8,
      totalCapacity: 1200,
      activeShows: 24,
      status: 'active',
    },
    {
      id: '2',
      name: 'INOX Multiplex',
      city: 'Mumbai',
      address: 'R City Mall, Ghatkopar West',
      screens: 6,
      totalCapacity: 900,
      activeShows: 18,
      status: 'active',
    },
    {
      id: '3',
      name: 'Cinepolis',
      city: 'Bangalore',
      address: 'Forum Mall, Koramangala',
      screens: 10,
      totalCapacity: 1500,
      activeShows: 30,
      status: 'active',
    },
    {
      id: '4',
      name: 'Fun Cinemas',
      city: 'Delhi',
      address: 'Select Citywalk, Saket',
      screens: 5,
      totalCapacity: 750,
      activeShows: 0,
      status: 'maintenance',
    },
    {
      id: '5',
      name: 'Carnival Cinemas',
      city: 'Chennai',
      address: 'Phoenix Marketcity, Velachery',
      screens: 7,
      totalCapacity: 1050,
      activeShows: 21,
      status: 'active',
    },
    {
      id: '6',
      name: 'Miraj Cinemas',
      city: 'Pune',
      address: 'Seasons Mall, Magarpatta City',
      screens: 4,
      totalCapacity: 600,
      activeShows: 0,
      status: 'inactive',
    },
  ];

  const cities = useMemo(() => 
    Array.from(new Set(venues.map(v => v.city))),
    [venues]
  );

  const filteredVenues = useMemo(() => {
    return venues.filter(venue => {
      const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           venue.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || venue.status === statusFilter;
      const matchesCity = cityFilter === 'all' || venue.city === cityFilter;
      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [venues, searchQuery, statusFilter, cityFilter]);

  const stats = {
    total: venues.length,
    active: venues.filter(v => v.status === 'active').length,
    totalScreens: venues.reduce((sum, v) => sum + v.screens, 0),
    totalCapacity: venues.reduce((sum, v) => sum + v.totalCapacity, 0),
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
        {filteredVenues.map(venue => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </div>

      {filteredVenues.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">No venues found</h3>
          <p className="text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
