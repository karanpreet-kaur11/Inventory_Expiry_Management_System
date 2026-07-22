import crypto from 'node:crypto';

const SCRYPT_KEYLEN = 64;
const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const hashBuffer = Buffer.from(hash, 'hex');
  const candidate = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return hashBuffer.length === candidate.length && crypto.timingSafeEqual(hashBuffer, candidate);
}

const isProd = process.env.NODE_ENV === 'production';
const DEV_FALLBACK_SECRET = 'dev-only-insecure-secret-change-me';
const JWT_SECRET = process.env.JWT_SECRET || (isProd ? null : DEV_FALLBACK_SECRET);

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}
if (JWT_SECRET === DEV_FALLBACK_SECRET) {
  console.warn('[auth] Using an insecure default JWT_SECRET for local development. Set a real JWT_SECRET env var for anything beyond local testing.');
}

function base64urlJSON(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

export function signToken(userId) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: userId, iat: now, exp: now + TOKEN_TTL_SECONDS };
  const data = `${base64urlJSON(header)}.${base64urlJSON(payload)}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signature] = parts;
  const data = `${headerB64}.${payloadB64}`;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
}
