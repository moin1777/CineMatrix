'use client';

import { useContext } from 'react';
import { ToastProvider, useToast } from '@/contexts/toast-context';

// Re-export the provider and hook
export { ToastProvider, useToast };

// Toaster component that just exists as a placeholder
// The actual toasts are rendered in ToastProvider
export function Toaster() {
  return null;
}
