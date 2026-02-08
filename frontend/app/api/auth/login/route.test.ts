import { describe, expect, it } from 'bun:test';
import { POST } from './route';

// Mock dbConnect to avoid starting MongoMemoryServer and making the test slow/flaky
// We can mock it by intercepting the module, but bun test mocking is still evolving.
// Alternatively, since we hit the rate limit *before* dbConnect, we might not need to mock it for the 6th request,
// but for the first 5 we do.

// Wait, the rate limit check is BEFORE dbConnect.
// So for the blocked request, dbConnect is not called.
// For the allowed requests, dbConnect IS called.

// To avoid DB connection, we can mock dbConnect.
import * as dbModule from '@/lib/db';

// We'll just assume for now that dbConnect works or fails gracefully.
// But we want to test rate limiting specifically.

describe('Login Route Rate Limiting', () => {
  it('should block after 5 requests from the same IP', async () => {
    const ip = '1.2.3.4';

    // We need to simulate 5 requests that "fail" login but pass rate limit.
    // However, they will try to connect to DB.
    // If we can't easily mock dbConnect, we might have issues.

    // Let's try to run it. If dbConnect fails, the route returns 500.
    // 500 is not 429, so we can distinguish.

    const makeRequest = async () => {
      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: {
          'x-forwarded-for': ip,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
      });
      return POST(req);
    };

    // 5 allowed requests
    for (let i = 0; i < 5; i++) {
      const res = await makeRequest();
      // It might return 401 (if DB works and user not found) or 500 (if DB fails) or 400.
      // But it should NOT be 429.
      expect(res.status).not.toBe(429);
    }

    // 6th request should be blocked
    const res = await makeRequest();
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.msg).toContain('Too many login attempts');
  });
});
