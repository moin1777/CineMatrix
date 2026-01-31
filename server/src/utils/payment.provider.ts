import CircuitBreaker from 'opossum';
import { v4 as uuidv4 } from 'uuid';

// ============ MOCK PAYMENT PROVIDER ============

interface PaymentResult {
  paymentId: string;
  status: 'succeeded' | 'failed' | 'pending';
  amount: number;
  currency: string;
  createdAt: Date;
}

interface RefundResult {
  refundId: string;
  paymentId: string;
  amount: number;
  status: 'succeeded' | 'failed' | 'pending';
  createdAt: Date;
}

// Simulated payment processing
const stripeCharge = async (amount: number, source: string): Promise<PaymentResult> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

  // Simulate Random Failures (10% chance in development)
  if (Math.random() < 0.1) {
    throw new Error('Stripe API Timeout');
  }

  // Simulate invalid card (if source contains 'invalid')
  if (source.includes('invalid')) {
    throw new Error('Card declined');
  }

  return {
    paymentId: `pi_${uuidv4().replace(/-/g, '').substring(0, 24)}`,
    status: 'succeeded',
    amount,
    currency: 'usd',
    createdAt: new Date()
  };
};

// Simulated refund processing
const stripeRefund = async (paymentId: string, amount: number): Promise<RefundResult> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

  // Simulate Random Failures (5% chance)
  if (Math.random() < 0.05) {
    throw new Error('Refund processing failed');
  }

  return {
    refundId: `re_${uuidv4().replace(/-/g, '').substring(0, 24)}`,
    paymentId,
    amount,
    status: 'succeeded',
    createdAt: new Date()
  };
};

// ============ CIRCUIT BREAKER CONFIGURATION ============

const breakerOptions = {
  timeout: 5000,                    // If function takes longer than 5 seconds, trigger failure
  errorThresholdPercentage: 50,     // When 50% of requests fail
  resetTimeout: 10000,              // After 10 seconds, try again
  volumeThreshold: 5,               // Minimum requests before tripping
  rollingCountTimeout: 10000,       // Rolling window for error tracking
  rollingCountBuckets: 10           // Number of buckets in rolling window
};

// Payment circuit breaker
const paymentBreaker = new CircuitBreaker(stripeCharge, breakerOptions);

paymentBreaker.on('open', () => {
  console.warn('⚠️ Payment circuit breaker OPENED - too many failures');
});

paymentBreaker.on('halfOpen', () => {
  console.info('🔄 Payment circuit breaker HALF-OPEN - testing recovery');
});

paymentBreaker.on('close', () => {
  console.info('✅ Payment circuit breaker CLOSED - service recovered');
});

paymentBreaker.fallback(() => {
  throw new Error('Payment Service Unavailable (Circuit Open). Please try again later.');
});

// Refund circuit breaker
const refundBreaker = new CircuitBreaker(stripeRefund, {
  ...breakerOptions,
  timeout: 10000,  // Refunds can take longer
  resetTimeout: 30000
});

refundBreaker.fallback(() => {
  throw new Error('Refund Service Unavailable. Your refund has been queued for processing.');
});

// ============ EXPORTED FUNCTIONS ============

export const processPayment = async (amount: number, source: string): Promise<string> => {
  const result = await paymentBreaker.fire(amount, source) as PaymentResult;
  return result.paymentId;
};

export const processRefund = async (paymentId: string, amount: number): Promise<string> => {
  const result = await refundBreaker.fire(paymentId, amount) as RefundResult;
  return result.refundId;
};

// Get circuit breaker stats for monitoring
export const getPaymentServiceStats = () => ({
  payment: {
    state: paymentBreaker.opened ? 'OPEN' : paymentBreaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
    stats: paymentBreaker.stats
  },
  refund: {
    state: refundBreaker.opened ? 'OPEN' : refundBreaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
    stats: refundBreaker.stats
  }
});

// ============ REFUND QUEUE (FOR FAILED IMMEDIATE REFUNDS) ============

interface QueuedRefund {
  paymentId: string;
  amount: number;
  bookingId: string;
  userId: string;
  reason: string;
  attempts: number;
  createdAt: Date;
  lastAttempt?: Date;
}

// In-memory queue (should use Redis or a proper queue in production)
const refundQueue: QueuedRefund[] = [];

export const queueRefund = (refund: Omit<QueuedRefund, 'attempts' | 'createdAt'>) => {
  refundQueue.push({
    ...refund,
    attempts: 0,
    createdAt: new Date()
  });
  console.log(`📋 Refund queued for payment ${refund.paymentId}`);
};

export const processQueuedRefunds = async () => {
  const pending = refundQueue.filter(r => r.attempts < 3);
  
  for (const refund of pending) {
    try {
      await processRefund(refund.paymentId, refund.amount);
      // Remove from queue on success
      const index = refundQueue.indexOf(refund);
      if (index > -1) refundQueue.splice(index, 1);
      console.log(`✅ Queued refund processed for payment ${refund.paymentId}`);
    } catch (error) {
      refund.attempts++;
      refund.lastAttempt = new Date();
      console.error(`❌ Queued refund failed (attempt ${refund.attempts}): ${refund.paymentId}`);
    }
  }
};

export const getQueuedRefunds = () => [...refundQueue];
