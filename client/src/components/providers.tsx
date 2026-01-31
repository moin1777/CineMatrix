'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { BookingProvider } from '@/contexts/booking-context';
import { ToastProvider } from '@/contexts/toast-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <BookingProvider>{children}</BookingProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
