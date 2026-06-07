const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET environment variable must be set in production');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-dev-secret-change-in-production';

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, JWT_SECRET };
