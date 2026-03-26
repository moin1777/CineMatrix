'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/contexts/auth-context';
import { BookingProvider } from '@/contexts/booking-context';
import { ToastProvider } from '@/contexts/toast-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <AuthProvider>
          <BookingProvider>{children}</BookingProvider>
        </AuthProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
