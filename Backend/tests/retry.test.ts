import { calculateExponentialBackoff } from '../src/lib/dedup';
import { isTransientSyncError } from '../src/lib/error-classifier';

describe('Phase F-9 Auto-Retry Foundation', () => {
  describe('calculateExponentialBackoff', () => {
    it('calculates delay around base 1000ms with jitter for attempt 0', () => {
      const delay = calculateExponentialBackoff(0);
      expect(delay).toBeGreaterThanOrEqual(800);
      expect(delay).toBeLessThanOrEqual(1200);
    });

    it('multiplies base delay exponentially', () => {
      const delayAttempt1 = calculateExponentialBackoff(1);
      expect(delayAttempt1).toBeGreaterThanOrEqual(1600);
      expect(delayAttempt1).toBeLessThanOrEqual(2400);
    });

    it('caps maximum delay at 300,000ms', () => {
      const delayHigh = calculateExponentialBackoff(20);
      expect(delayHigh).toBeLessThanOrEqual(360000);
    });
  });

  describe('isTransientSyncError', () => {
    it('returns true for HTTP 429 and 503', () => {
      expect(isTransientSyncError({ status: 429 })).toBe(true);
      expect(isTransientSyncError({ status: 503 })).toBe(true);
    });

    it('returns true for network timeouts and disconnects', () => {
      expect(isTransientSyncError({ code: 'ECONNRESET' })).toBe(true);
      expect(isTransientSyncError({ code: 'ETIMEDOUT' })).toBe(true);
      expect(isTransientSyncError({ message: 'Request throttled by QuickBooks' })).toBe(true);
    });

    it('returns false for permanent 400 and 401 errors', () => {
      expect(isTransientSyncError({ status: 400, message: 'Validation failed' })).toBe(false);
      expect(isTransientSyncError({ status: 401, message: 'Unauthorized' })).toBe(false);
      expect(isTransientSyncError({ status: 403, message: 'Forbidden' })).toBe(false);
    });
  });
});
