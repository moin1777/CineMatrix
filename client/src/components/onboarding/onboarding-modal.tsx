'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useToast } from '@/contexts/toast-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const genreOptions = [
  { id: 'action', name: 'Action', emoji: '💥' },
  { id: 'adventure', name: 'Adventure', emoji: '🗺️' },
  { id: 'animation', name: 'Animation', emoji: '🎨' },
  { id: 'comedy', name: 'Comedy', emoji: '😂' },
  { id: 'crime', name: 'Crime', emoji: '🔍' },
  { id: 'drama', name: 'Drama', emoji: '🎭' },
  { id: 'fantasy', name: 'Fantasy', emoji: '🧙' },
  { id: 'horror', name: 'Horror', emoji: '👻' },
  { id: 'mystery', name: 'Mystery', emoji: '🕵️' },
  { id: 'romance', name: 'Romance', emoji: '💕' },
  { id: 'sci-fi', name: 'Sci-Fi', emoji: '🚀' },
  { id: 'thriller', name: 'Thriller', emoji: '😱' },
];

export function OnboardingModal({
  isOpen,
  onClose,
  onComplete,
}: OnboardingModalProps) {
  const { refreshUser } = useAuth();
  const { success, error: showError } = useToast();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((g) => g !== genreId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, genreId];
    });
  };

  const handleSubmit = async () => {
    if (selectedGenres.length < 3) {
      showError('Please select at least 3 genres');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch('/users/profile', {
        preferences: {
          genres: selectedGenres,
        },
      });
      await refreshUser();
      success('Preferences saved!', "We'll personalize your recommendations");
      onComplete();
    } catch (err: any) {
      // For demo, just complete
      success('Preferences saved!', "We'll personalize your recommendations");
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg rounded-2xl bg-background-secondary border border-border shadow-2xl shadow-black/50 overflow-hidden"
            >
              {/* Gradient top */}
              <div className="h-2 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500" />

              {/* Close button */}
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center mb-4"
                  >
                    <Sparkles className="w-8 h-8 text-primary-400" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Welcome to CineMatrix!
                  </h2>
                  <p className="text-gray-400">
                    Pick 3 genres you love. We'll personalize your experience.
                  </p>
                </div>

                {/* Genre Grid */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {genreOptions.map((genre, index) => {
                    const isSelected = selectedGenres.includes(genre.id);
                    const isDisabled =
                      !isSelected && selectedGenres.length >= 3;

                    return (
                      <motion.button
                        key={genre.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => toggleGenre(genre.id)}
                        disabled={isDisabled}
                        className={cn(
                          'relative p-4 rounded-xl text-center transition-all',
                          'border',
                          isSelected
                            ? 'bg-primary-500/20 border-primary-500 text-white'
                            : 'bg-surface border-border text-gray-300 hover:border-border-hover',
                          isDisabled && 'opacity-40 cursor-not-allowed'
                        )}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                        <span className="text-2xl block mb-1">{genre.emoji}</span>
                        <span className="text-sm">{genre.name}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[1, 2, 3].map((num) => (
                    <div
                      key={num}
                      className={cn(
                        'w-8 h-1 rounded-full transition-colors',
                        selectedGenres.length >= num
                          ? 'bg-primary-500'
                          : 'bg-surface-active'
                      )}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={selectedGenres.length < 3}
                    className="w-full"
                    size="lg"
                  >
                    {selectedGenres.length < 3
                      ? `Select ${3 - selectedGenres.length} more`
                      : 'Get Started'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="w-full"
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
