const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ msg: 'No authorization header provided' });
  }

  // Check if token is in Bearer format
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ msg: 'Authorization header must be Bearer token' });
  }

  const token = parts[1];
  
  if (!token) {
    return res.status(401).json({ msg: 'No token provided in Authorization header' });
  }

  // Check if JWT_SECRET is set
  if (!process.env.JWT_SECRET) {
    console.error('Auth - JWT_SECRET is not configured');
    return res.status(500).json({ msg: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
