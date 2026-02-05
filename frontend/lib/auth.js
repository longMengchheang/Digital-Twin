import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config';

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
