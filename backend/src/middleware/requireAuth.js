import { verifyToken } from '../utils/auth.js';

export function requireAuth(req, res, next) {
  const payload = verifyToken(req.cookies?.token);
  if (!payload) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.userId = payload.sub;
  next();
}
