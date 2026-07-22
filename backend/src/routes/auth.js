import { Router } from 'express';
import { db } from '../db.js';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../utils/auth.js';

const router = Router();
const isProd = process.env.NODE_ENV === 'production';

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function serializeUser(row) {
  return { id: row.id, email: row.email, name: row.name };
}

router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = hashPassword(password);
  const info = db
    .prepare('INSERT INTO users (email, passwordHash, name) VALUES (?, ?, ?)')
    .run(normalizedEmail, passwordHash, name?.trim() || null);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);

  setAuthCookie(res, signToken(user.id));
  res.status(201).json(serializeUser(user));
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  setAuthCookie(res, signToken(user.id));
  res.json(serializeUser(user));
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.status(204).end();
});

router.get('/me', (req, res) => {
  const payload = verifyToken(req.cookies?.token);
  if (!payload) return res.status(401).json({ error: 'Not authenticated' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.json(serializeUser(user));
});

export default router;
