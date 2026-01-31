'use client';

import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { formatCountdown, formatCurrency, cn } from '@/lib/utils';
import type { Seat } from '@/types/seat';

interface LockTimerFooterProps {
  selectedSeats: Seat[];
  totalPrice: number;
  remainingSeconds: number;
  isLocked: boolean;
  isLocking: boolean;
  onLockSeats: () => void;
  onProceed: () => void;
}

export function LockTimerFooter({
  selectedSeats,
  totalPrice,
  remainingSeconds,
  isLocked,
  isLocking,
  onLockSeats,
  onProceed,
}: LockTimerFooterProps) {
  const isLowTime = remainingSeconds > 0 && remainingSeconds <= 60;
  const progress = isLocked ? (remainingSeconds / 300) * 100 : 0;

  if (selectedSeats.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-background-secondary/95 backdrop-blur-xl border-t border-border"
    >
      {/* Progress Bar */}
      {isLocked && (
        <div className="h-1 bg-surface-active overflow-hidden">
          <motion.div
            className={cn(
              'h-full transition-colors',
              isLowTime ? 'bg-red-500' : 'bg-primary-500'
            )}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Seat Info */}
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-400">
                {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'} Selected
              </p>
              <p className="text-sm text-gray-500">
                {selectedSeats.map((s) => s.label).join(', ')}
              </p>
            </div>
            <div className="h-10 w-px bg-border hidden sm:block" />
            <div className="hidden sm:block">
              <p className="text-sm text-gray-400">Total Amount</p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(totalPrice)}
              </p>
            </div>
          </div>

          {/* Timer & Actions */}
          <div className="flex items-center gap-4">
            {isLocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  isLowTime
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-primary-500/10 text-primary-400'
                )}
              >
                {isLowTime ? (
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                <span className="font-mono font-medium text-lg">
                  {formatCountdown(remainingSeconds)}
                </span>
              </motion.div>
            )}

            {!isLocked ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLockSeats}
                disabled={isLocking}
                className="btn-primary btn-lg"
              >
                {isLocking ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Locking...
                  </>
                ) : (
                  <>Lock Seats</>
                )}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onProceed}
                className="btn-primary btn-lg"
              >
                Proceed to Pay {formatCurrency(totalPrice)}
              </motion.button>
            )}
          </div>
        </div>

        {/* Mobile Price */}
        <div className="mt-3 pt-3 border-t border-border sm:hidden">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Total Amount</span>
            <span className="text-xl font-bold text-white">
              {formatCurrency(totalPrice)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
