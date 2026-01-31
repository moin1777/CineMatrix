'use client';

import { ReactNode, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './auth-context';
import { ToastProvider } from './toast-context';
import { BookingProvider } from './booking-context';
import { OnboardingModal } from '@/components/onboarding/onboarding-modal';

function OnboardingWrapper({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user just logged in and needs onboarding
    if (isAuthenticated && user && !isLoading) {
      // Check if user has no preferences set (first-time)
      const hasPreferences = user.preferences?.genres?.length;
      const hasSeenOnboarding = localStorage.getItem('cinematrix_onboarding_complete');
      
      if (!hasPreferences && !hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, user, isLoading]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('cinematrix_onboarding_complete', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingClose = () => {
    localStorage.setItem('cinematrix_onboarding_complete', 'true');
    setShowOnboarding(false);
  };

  return (
    <>
      {children}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <BookingProvider>
          <OnboardingWrapper>
            {children}
          </OnboardingWrapper>
        </BookingProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
