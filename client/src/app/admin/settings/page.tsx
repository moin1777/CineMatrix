'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';

interface AdminSettings {
  booking: {
    allowGuestCheckout: boolean;
    holdMinutes: number;
    maxTicketsPerBooking: number;
  };
  payments: {
    providerMode: 'test' | 'live';
    cashEnabled: boolean;
    cardEnabled: boolean;
    upiEnabled: boolean;
  };
  notifications: {
    supportEmail: string;
    alertOnFailedPayments: boolean;
  };
  operations: {
    maintenanceMode: boolean;
  };
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const { isAuthenticated, isLoading } = useAuth();

  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<AdminSettings>('/admin/settings');
      setSettings(response);
    } catch (err: any) {
      setError(err?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    loadSettings();
  }, [isLoading, isAuthenticated]);

  const updateSettings = <K extends keyof AdminSettings>(section: K, value: AdminSettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [section]: value });
  };

  const onSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await api.put<AdminSettings>('/admin/settings', {
        booking: settings.booking,
        payments: settings.payments,
        notifications: settings.notifications,
        operations: settings.operations
      });
      setSettings(updated);
      setSuccess('Settings updated successfully');
    } catch (err: any) {
      setError(err?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return <div className="h-40 bg-surface-card rounded-xl border border-gray-800 animate-pulse" />;
  }

  if (error && !settings) {
    return <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">{error}</div>;
  }

  if (!settings) {
    return <div className="text-gray-400">No settings found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Live platform configuration for admin operations.</p>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
      {success && <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-card border border-gray-800 rounded-xl p-4 space-y-4">
          <h2 className="text-white font-semibold">Booking</h2>

          <label className="flex items-center justify-between text-sm text-gray-300">
            <span>Allow guest checkout</span>
            <input
              type="checkbox"
              checked={settings.booking.allowGuestCheckout}
              onChange={(event) => updateSettings('booking', { ...settings.booking, allowGuestCheckout: event.target.checked })}
            />
          </label>

          <label className="block text-sm text-gray-300">
            Hold minutes
            <input
              type="number"
              min={1}
              max={30}
              value={settings.booking.holdMinutes}
              onChange={(event) => updateSettings('booking', { ...settings.booking, holdMinutes: Number(event.target.value) || 1 })}
              className="mt-1 w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white"
            />
          </label>

          <label className="block text-sm text-gray-300">
            Max tickets per booking
            <input
              type="number"
              min={1}
              max={20}
              value={settings.booking.maxTicketsPerBooking}
              onChange={(event) => updateSettings('booking', { ...settings.booking, maxTicketsPerBooking: Number(event.target.value) || 1 })}
              className="mt-1 w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white"
            />
          </label>
        </div>

        <div className="bg-surface-card border border-gray-800 rounded-xl p-4 space-y-4">
          <h2 className="text-white font-semibold">Payments</h2>

          <label className="block text-sm text-gray-300">
            Provider mode
            <select
              value={settings.payments.providerMode}
              onChange={(event) => updateSettings('payments', { ...settings.payments, providerMode: event.target.value as 'test' | 'live' })}
              className="mt-1 w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white"
            >
              <option value="test">Test</option>
              <option value="live">Live</option>
            </select>
          </label>

          <label className="flex items-center justify-between text-sm text-gray-300">
            <span>Enable cash</span>
            <input
              type="checkbox"
              checked={settings.payments.cashEnabled}
              onChange={(event) => updateSettings('payments', { ...settings.payments, cashEnabled: event.target.checked })}
            />
          </label>

          <label className="flex items-center justify-between text-sm text-gray-300">
            <span>Enable card</span>
            <input
              type="checkbox"
              checked={settings.payments.cardEnabled}
              onChange={(event) => updateSettings('payments', { ...settings.payments, cardEnabled: event.target.checked })}
            />
          </label>

          <label className="flex items-center justify-between text-sm text-gray-300">
            <span>Enable UPI</span>
            <input
              type="checkbox"
              checked={settings.payments.upiEnabled}
              onChange={(event) => updateSettings('payments', { ...settings.payments, upiEnabled: event.target.checked })}
            />
          </label>
        </div>

        <div className="bg-surface-card border border-gray-800 rounded-xl p-4 space-y-4">
          <h2 className="text-white font-semibold">Notifications</h2>

          <label className="block text-sm text-gray-300">
            Support email
            <input
              type="email"
              value={settings.notifications.supportEmail}
              onChange={(event) => updateSettings('notifications', { ...settings.notifications, supportEmail: event.target.value })}
              className="mt-1 w-full px-3 py-2 bg-surface-active border border-gray-700 rounded-lg text-white"
            />
          </label>

          <label className="flex items-center justify-between text-sm text-gray-300">
            <span>Alert on failed payments</span>
            <input
              type="checkbox"
              checked={settings.notifications.alertOnFailedPayments}
              onChange={(event) => updateSettings('notifications', { ...settings.notifications, alertOnFailedPayments: event.target.checked })}
            />
          </label>
        </div>

        <div className="bg-surface-card border border-gray-800 rounded-xl p-4 space-y-4">
          <h2 className="text-white font-semibold">Operations</h2>

          <label className="flex items-center justify-between text-sm text-gray-300">
            <span>Maintenance mode</span>
            <input
              type="checkbox"
              checked={settings.operations.maintenanceMode}
              onChange={(event) => updateSettings('operations', { ...settings.operations, maintenanceMode: event.target.checked })}
            />
          </label>

          <p className="text-xs text-gray-500">
            Last updated: {new Date(settings.updatedAt).toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
}
