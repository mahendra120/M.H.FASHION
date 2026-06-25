import { NextRequest, NextResponse } from 'next/server';
import { signAuthToken, getTokenCookieName, getTokenCookieOptions } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/auth/validators';
import { authenticateUser, useLocalUserStore } from '@/lib/auth/user-store';
import { getPostAuthRedirect } from '@/lib/auth/redirect';
import { authLog } from '@/lib/auth/debug';
import { isMongoConfigured } from '@/lib/mongodb';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60_000;

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, 'auth-login', LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    const next = typeof body.next === 'string' ? body.next : null;

    authLog('login: request received', {
      store: useLocalUserStore() ? 'local' : isMongoConfigured() ? 'mongodb' : 'none',
      hasNext: Boolean(next),
    });

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid input';
      authLog('login: validation failed', { message, issues: parsed.error.issues });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const publicUser = await authenticateUser(email, password);

    if (!publicUser) {
      authLog('login: authentication failed', { email: email.toLowerCase() });
      const store = useLocalUserStore() ? 'local' : isMongoConfigured() ? 'mongodb' : 'none';
      if (store === 'none' && !process.env.ADMIN_EMAILS?.trim()) {
        return NextResponse.json(
          { error: 'Server auth is not configured. Set ADMIN_EMAILS and ADMIN_SEED_* on Vercel, then redeploy.' },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const redirectTo = getPostAuthRedirect(publicUser.role, next);
    const token = signAuthToken({
      userId: publicUser.id,
      email: publicUser.email,
      role: publicUser.role,
    });

    authLog('login: success', {
      email: publicUser.email,
      role: publicUser.role,
      redirectTo,
      userId: publicUser.id,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Signed in successfully',
      user: publicUser,
      token,
      redirectTo,
    });
    response.cookies.set(getTokenCookieName(), token, getTokenCookieOptions());
    return response;
  } catch (error) {
    console.error('[auth/login] unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
