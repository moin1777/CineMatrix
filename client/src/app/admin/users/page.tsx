'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  isActive: boolean;
  bookingCount: number;
  createdAt: string;
  lastLogin: string | null;
}

interface UsersResponse {
  items: AdminUserItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    adminUsers: number;
  };
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Never';
  return new Date(value).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function AdminUsersPage() {
  const { isAuthenticated, isLoading } = useAuth();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | 'user' | 'admin'>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<UsersResponse>(
        `/admin/users?page=${page}&limit=20&search=${encodeURIComponent(search)}&role=${role}&status=${status}`
      );
      setData(response);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    loadUsers();
  }, [isLoading, isAuthenticated, page, role, status]);

  const onSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    loadUsers();
  };

  const onToggleStatus = async (user: AdminUserItem) => {
    setUpdatingId(user.id);
    setError(null);
    try {
      await api.patch(`/admin/users/${user.id}/status`, { isActive: !user.isActive });
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || 'Failed to update user status');
    } finally {
      setUpdatingId(null);
    }
  };

  const users = useMemo(() => data?.items || [], [data]);

  if (isLoading || loading) {
    return <div className="h-40 bg-surface-card rounded-xl border border-gray-800 animate-pulse" />;
  }

  if (error && !data) {
    return <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400">Monitor account status and admin access.</p>
        </div>
        <button onClick={loadUsers} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          Refresh
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-gray-800 rounded-xl p-4"><p className="text-xs text-gray-500">Total Users</p><p className="text-2xl font-bold text-white">{data?.summary.totalUsers || 0}</p></div>
        <div className="bg-surface-card border border-gray-800 rounded-xl p-4"><p className="text-xs text-gray-500">Active</p><p className="text-2xl font-bold text-green-400">{data?.summary.activeUsers || 0}</p></div>
        <div className="bg-surface-card border border-gray-800 rounded-xl p-4"><p className="text-xs text-gray-500">Inactive</p><p className="text-2xl font-bold text-yellow-400">{data?.summary.inactiveUsers || 0}</p></div>
        <div className="bg-surface-card border border-gray-800 rounded-xl p-4"><p className="text-xs text-gray-500">Admins</p><p className="text-2xl font-bold text-primary-400">{data?.summary.adminUsers || 0}</p></div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={onSearchSubmit} className="flex-1">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, phone"
            className="w-full px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
        </form>

        <select
          value={role}
          onChange={(event) => {
            setRole(event.target.value as 'all' | 'user' | 'admin');
            setPage(1);
          }}
          className="px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
        >
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as 'all' | 'active' | 'inactive');
            setPage(1);
          }}
          className="px-4 py-2 bg-surface-active border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-surface-card border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-surface-active border-b border-gray-800">
            <tr className="text-left text-gray-400">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Bookings</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Last Login</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No users found.</td>
              </tr>
            )}

            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-800/70 last:border-b-0">
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-gray-400">{user.email}</p>
                  <p className="text-gray-500 text-xs">{user.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-primary-500/20 text-primary-300' : 'bg-gray-700 text-gray-300'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-200">{user.bookingCount}</td>
                <td className="px-4 py-3 text-gray-300">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3 text-gray-300">{formatDate(user.lastLogin)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onToggleStatus(user)}
                    disabled={updatingId === user.id}
                    className={`px-3 py-1.5 rounded text-xs transition-colors ${user.isActive ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'}`}
                  >
                    {updatingId === user.id ? 'Updating...' : user.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="px-3 py-1.5 rounded border border-gray-700 text-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {data.pagination.page} of {data.pagination.pages}
          </span>
          <button
            disabled={page >= data.pagination.pages}
            onClick={() => setPage((prev) => Math.min(data.pagination.pages, prev + 1))}
            className="px-3 py-1.5 rounded border border-gray-700 text-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
