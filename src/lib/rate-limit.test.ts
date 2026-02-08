import { describe, expect, it, beforeEach } from 'bun:test';
import { RateLimiter } from './rate-limit';

describe('RateLimiter', () => {
  let limiter: RateLimiter;
  const windowMs = 1000; // 1 second
  const limit = 3;

  beforeEach(() => {
    limiter = new RateLimiter(windowMs, limit);
  });

  it('should allow requests under the limit', () => {
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(true);
  });

  it('should block requests over the limit', () => {
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(false);
  });

  it('should handle different keys independently', () => {
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(false);

    // Different IP should be allowed
    expect(limiter.check('ip2')).toBe(true);
  });

  it('should reset after window expires', async () => {
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(false);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, windowMs + 100));

    expect(limiter.check('ip1')).toBe(true);
  });
});
