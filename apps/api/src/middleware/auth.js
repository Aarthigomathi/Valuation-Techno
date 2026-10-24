import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db } from '../db.js';
export function sign(user) { return jwt.sign({ id: user.id, role: user.role, email: user.email }, config.jwtSecret, { expiresIn: '7d' }); }
export function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({ error: 'Login required' });
  try {
    const payload = jwt.verify(h.slice(7), config.jwtSecret);
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user; next();
  } catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
}
export const requireRole = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` });
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
