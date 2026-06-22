import { NextRequest } from 'next/server';
import { verifyAuthToken, getTokenCookieName } from '@/lib/auth/jwt';
import { findAuthUserById, findUserById } from '@/lib/auth/user-store';

export async function getPublicUserFromRequest(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    return findUserById(payload.userId);
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req: NextRequest) {
  const token = extractBearerToken(req);
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    const user = await findAuthUserById(payload.userId);
    if (!user) return null;
    return {
      _id: { toString: () => user.id } as { toString: () => string },
      email: user.email,
      role: user.role === 'admin' ? 'admin' : 'user',
    } as { _id: { toString: () => string }; email: string; role: string };
  } catch {
    return null;
  }
}

export function isUserAdmin(user: { role: string }): boolean {
  return user.role === 'admin';
}

export function extractBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (token) return token;
  return req.cookies.get(getTokenCookieName())?.value ?? null;
}
