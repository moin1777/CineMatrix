'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Ticket, 
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  Edit2,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ProfileSkeleton } from '@/components/ui/skeleton';
import { getInitials, cn } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth();
  const { success, error: showError } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?returnTo=/profile');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.patch('/users/profile', {
        name: editName,
        phone: editPhone || undefined,
      });
      await refreshUser();
      setIsEditing(false);
      success('Profile updated successfully');
    } catch (err: any) {
      showError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProfileSkeleton />
      </div>
    );
  }

  if (!user) return null;

  const menuItems = [
    { icon: Ticket, label: 'My Bookings', href: '/bookings', count: null },
    { icon: Heart, label: 'Wishlist', href: '/wishlist', count: null },
    { icon: Settings, label: 'Preferences', href: '/preferences', count: null },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Profile Card */}
          <div className="card p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-3xl font-bold text-white">
                  {getInitials(user.name)}
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-surface border border-border text-gray-400 hover:text-white transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                <p className="text-gray-400 mt-1">{user.email}</p>
                {user.phone && (
                  <p className="text-gray-400 mt-1">+91 {user.phone}</p>
                )}
                <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-sm">
                    {user.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                  {user.preferences?.genres?.length ? (
                    <span className="px-3 py-1 rounded-full bg-surface-active text-gray-300 text-sm">
                      {user.preferences.genres.length} Favorite Genres
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Edit Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card overflow-hidden mb-6">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className={cn(
                  'w-full flex items-center justify-between p-4 hover:bg-surface-hover transition-colors',
                  index < menuItems.length - 1 && 'border-b border-border'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-active flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className="text-white font-medium">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            ))}
          </div>

          {/* Logout */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full card p-4 flex items-center justify-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              label="Full Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              label="Phone Number"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="pl-10"
              placeholder="10-digit number"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsEditing(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              loading={isSaving}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Log Out"
        description="Are you sure you want to log out?"
      >
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowLogoutModal(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleLogout}
            className="flex-1"
          >
            Log Out
          </Button>
        </div>
      </Modal>
    </div>
  );
}
