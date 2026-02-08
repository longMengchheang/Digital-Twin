import { describe, test, expect, mock } from 'bun:test';
import { verifyToken, signToken, type DecodedUser, withAuth } from './auth';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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

  describe('signToken', () => {
    test('generates a token', () => {
      const token = signToken(mockUser);
      expect(token).toBeString();
      expect(token.length).toBeGreaterThan(0);
    });
  });

  describe('verifyToken', () => {
    test('should return null if authorization header is missing', () => {
      const req = new Request("http://localhost", {
        headers: {},
      });
      expect(verifyToken(req)).toBeNull();
    });

    test('should return null if authorization header does not start with Bearer', () => {
      const req = new Request("http://localhost", {
        headers: {
          authorization: "Basic somecredential",
        },
      });
      expect(verifyToken(req)).toBeNull();
    });

    test('should return null if token is missing after Bearer', () => {
      const req = new Request("http://localhost", {
        headers: {
          authorization: "Bearer ", // just whitespace
        },
      });
      expect(verifyToken(req)).toBeNull();
    });

    test('should return null if token is invalid', () => {
      const req = new Request("http://localhost", {
        headers: {
          authorization: "Bearer invalid.token.string",
        },
      });
      expect(verifyToken(req)).toBeNull();
    });

    test('should return decoded user if token is valid', () => {
      const token = signToken(mockUser);
      const req = new Request("http://localhost", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const user = verifyToken(req);
      expect(user).not.toBeNull();
      expect(user?.id).toBe(mockUser.id);
      expect(user?.email).toBe(mockUser.email);
    });

    test("should return null if token is expired", () => {
      // Manually create an expired token
      // Note: The payload structure in auth.ts is { user: DecodedUser }
      const expiredToken = jwt.sign(
        { user: mockUser },
        process.env.JWT_SECRET!,
        { expiresIn: "-1s" } // expired 1 second ago
      );

      const req = new Request("http://localhost", {
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      });

      expect(verifyToken(req)).toBeNull();
    });
  });
});
