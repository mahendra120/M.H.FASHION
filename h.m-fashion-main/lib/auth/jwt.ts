import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';
const COOKIE_NAME = 'mhf_token';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

export function getJwtSecret(): string {
  if (JWT_SECRET) return JWT_SECRET;
  if (process.env.NODE_ENV === 'development') {
    return 'mhfashion-local-dev-jwt-secret-do-not-use-in-production';
  }
  throw new Error('JWT_SECRET is not defined. Add it to your .env.local file.');
}

export function signAuthToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

export function getTokenCookieName(): string {
  return COOKIE_NAME;
}

export function getTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}
