import { NextRequest, NextResponse } from 'next/server';
import { upsertAdminUser } from '@/lib/auth/user-store';
import { isMongoConfigured } from '@/lib/mongodb';
import { auditLog } from '@/lib/audit-log';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const SEED_LIMIT = 3;
const SEED_WINDOW_MS = 60 * 60_000;

/**
 * One-time admin seed on production (Vercel can reach MongoDB Atlas).
 * POST with header: x-admin-seed-secret: <ADMIN_SEED_PASSWORD>
 */
export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, 'admin-seed', SEED_LIMIT, SEED_WINDOW_MS);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: 'MONGODB_URI is not configured on this deployment.' },
      { status: 503 },
    );
  }

  const secret = req.headers.get('x-admin-seed-secret')?.trim();
  const expected = process.env.ADMIN_SEED_PASSWORD?.trim();
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD?.trim();
  const name = process.env.ADMIN_SEED_NAME?.trim() || 'Admin';

  if (!email || !password) {
    return NextResponse.json(
      { error: 'ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set on Vercel.' },
      { status: 503 },
    );
  }

  try {
    const user = await upsertAdminUser({ name, email, password });
    auditLog('admin.seeded', { email: user.email, userId: user.id });
    return NextResponse.json({
      ok: true,
      message: `Admin account ready for ${user.email}`,
      userId: user.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Seed failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
