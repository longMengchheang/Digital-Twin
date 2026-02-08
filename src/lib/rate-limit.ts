interface RateLimitInfo {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private requests: Map<string, RateLimitInfo>;
  private windowMs: number;
  private limit: number;

  constructor(windowMs: number, limit: number) {
    this.requests = new Map();
    this.windowMs = windowMs;
    this.limit = limit;
  }

  check(key: string): boolean {
    const now = Date.now();

    // Probabilistic cleanup to remove expired entries and prevent memory leaks
    if (Math.random() < 0.01) {
      this.cleanup(now);
    }

    const info = this.requests.get(key);

    if (!info || now > info.resetTime) {
      // New window or expired window
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (info.count >= this.limit) {
      // Limit exceeded
      return false;
    }

    // Increment count
    info.count++;
    return true;
  }

  private cleanup(now: number) {
    for (const [key, info] of Array.from(this.requests.entries())) {
      if (now > info.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}
