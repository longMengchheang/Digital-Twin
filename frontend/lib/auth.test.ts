import { describe, test, expect, mock } from 'bun:test';
import { verifyToken, signToken, DecodedUser, withAuth } from './auth';
import { NextResponse } from 'next/server';

// Set JWT_SECRET for testing
process.env.JWT_SECRET = 'test-secret';

describe('Auth Utilities', () => {
  const mockUser: DecodedUser = {
    id: 'user123',
    email: 'test@example.com',
  };

  describe('withAuth', () => {
    test('blocks unauthorized request', async () => {
      const handler = mock(async (_req: Request, _context: any, _user: DecodedUser) => {
        return NextResponse.json({ success: true });
      });

      const wrappedHandler = withAuth(handler);
      const req = new Request('http://localhost');
      const res = await wrappedHandler(req, {});

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toEqual({ msg: 'No token, authorization denied.' });
      expect(handler).not.toHaveBeenCalled();
    });

    test('allows authorized request', async () => {
      const handler = mock(async (_req: Request, _context: any, user: DecodedUser) => {
        return NextResponse.json({ success: true, userId: user.id });
      });

      const token = signToken(mockUser);
      const wrappedHandler = withAuth(handler);
      const req = new Request('http://localhost', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const res = await wrappedHandler(req, {});

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ success: true, userId: mockUser.id });
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  test('signToken generates a token', () => {
    const token = signToken(mockUser);
    expect(token).toBeString();
    expect(token.length).toBeGreaterThan(0);
  });

  test('verifyToken returns user for valid token', () => {
    const token = signToken(mockUser);
    const req = new Request('http://localhost', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const user = verifyToken(req);
    expect(user).not.toBeNull();
    expect(user?.id).toBe(mockUser.id);
    expect(user?.email).toBe(mockUser.email);
  });

  test('verifyToken returns null for missing header', () => {
    const req = new Request('http://localhost');
    const user = verifyToken(req);
    expect(user).toBeNull();
  });

  test('verifyToken returns null for invalid token', () => {
    const req = new Request('http://localhost', {
      headers: {
        authorization: 'Bearer invalid.token.here',
      },
    });
    const user = verifyToken(req);
    expect(user).toBeNull();
  });

  test('verifyToken returns null for malformed header', () => {
    const req = new Request('http://localhost', {
      headers: {
        authorization: 'Basic token',
      },
    });
    const user = verifyToken(req);
    expect(user).toBeNull();
  });
});
