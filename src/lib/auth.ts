import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { unauthorized } from './api-response';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

const JWT_SECRET = process.env.JWT_SECRET;

export interface DecodedUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

interface AuthPayload {
  user: DecodedUser;
}

export function signToken(user: DecodedUser): string {
  return jwt.sign({ user }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(req: Request): DecodedUser | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return decoded.user;
  } catch {
    return null;
  }
}

export function withAuth<T = any>(
  handler: (req: Request, context: T, user: DecodedUser) => Promise<NextResponse>
) {
  return async (req: Request, context: T) => {
    const user = verifyToken(req);
    if (!user) {
      return unauthorized();
    }
    return handler(req, context, user);
  };
}
