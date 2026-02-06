import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '4a8f5b3e2c1d9e7f6a5b4c3d2e1f0a9';

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
