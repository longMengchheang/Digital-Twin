const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');
  console.log('Auth - Authorization header:', authHeader);
  if (!authHeader) {
    console.log('Auth - No authorization header provided');
    return res.status(401).json({ msg: 'No authorization header provided' });
  }

  // Check if token is in Bearer format
  const parts = authHeader.split(' ');
  console.log('Auth - Header parts:', parts);
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('Auth - Invalid Bearer format:', parts);
    return res.status(401).json({ msg: 'Authorization header must be Bearer token' });
  }

  const token = parts[1];
  console.log('Auth - Extracted token:', token);
  
  if (!token) {
    console.log('Auth - No token provided in Authorization header');
    return res.status(401).json({ msg: 'No token provided in Authorization header' });
  }

  // Check if JWT_SECRET is set
  console.log('Auth - JWT_SECRET from .env:', process.env.JWT_SECRET);
  if (!process.env.JWT_SECRET) {
    console.error('Auth - JWT_SECRET is not configured');
    return res.status(500).json({ msg: 'Server configuration error' });
  }

  try {
    console.log('Auth - Attempting to verify token with JWT_SECRET:', process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth - Decoded token:', decoded);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Auth - Token verification error:', err.name, err.message);
    let msg = 'Token is not valid';
    if (err.name === 'TokenExpiredError') {
      msg = 'Token has expired';
    } else if (err.name === 'JsonWebTokenError') {
      msg = 'Invalid token';
    }
    res.status(401).json({ msg, error: err.message });
  }
};