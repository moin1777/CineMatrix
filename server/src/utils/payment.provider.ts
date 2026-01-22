import CircuitBreaker from 'opossum';

// Mock External API Call
const stripeCharge = async (amount: number, source: string): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Simulate Random Failures (10% chance)
  if (Math.random() < 0.1) {
    throw new Error('Stripe API Timeout');
  }

  return `ch_${Math.random().toString(36).substring(7)}`;
};

const breakerOptions = {
  timeout: 3000, // If function takes longer than 3 seconds, trigger failure
  errorThresholdPercentage: 50, // When 50% of requests fail
  resetTimeout: 10000 // After 30 seconds, try again.
};

const breaker = new CircuitBreaker(stripeCharge, breakerOptions);

breaker.fallback(() => {
  throw new Error('Payment Service Unavailable (Circuit Open)');
});

export const processPayment = (amount: number, source: string) => breaker.fire(amount, source);
