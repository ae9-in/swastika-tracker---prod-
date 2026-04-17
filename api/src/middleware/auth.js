import { verifyToken } from '../utils/jwt.js';
import { unauthorized, forbidden } from '../utils/errors.js';

export function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(unauthorized('Missing bearer token'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    req.auth = payload;
    return next();
  } catch {
    return next(unauthorized('Invalid or expired token'));
  }
}

export function requireBusiness(req, _res, next) {
  if (!req.auth?.activeBusinessId) {
    return next(unauthorized('Business context is required'));
  }
  return next();
}

export function authorizeRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.auth || !allowedRoles.includes(req.auth.role)) {
      return next(forbidden('Access denied: insufficient permissions'));
    }
    return next();
  };
}
