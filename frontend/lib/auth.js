import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '4a8f5b3e2c1d9e7f6a5b4c3d2e1f0a9'; // Same as backend server.js fallback

export function verifyToken(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.user;
  } catch (err) {
    return null;
  }
}
