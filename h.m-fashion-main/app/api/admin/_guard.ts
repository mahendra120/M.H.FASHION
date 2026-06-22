import { NextRequest, NextResponse } from 'next/server';
import { isMongoConfigured } from '@/lib/mongodb';
import { getUserFromRequest, isUserAdmin } from '@/lib/auth/session';
import { useLocalUserStore } from '@/lib/auth/user-store';

type GuardResult =
  | { ok: true; user: { id: string; email?: string } }
  | { ok: false; response: NextResponse };

export async function requireAdmin(req: NextRequest): Promise<GuardResult> {
  if (!isMongoConfigured() && !useLocalUserStore()) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication database not configured' }, { status: 503 }),
    };
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (!isUserAdmin(user)) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { ok: true, user: { id: user._id.toString(), email: user.email } };
}
