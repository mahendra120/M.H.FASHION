import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signAuthToken, getTokenCookieName, getTokenCookieOptions } from '@/lib/auth/jwt';
import { signupSchema } from '@/lib/auth/validators';
import { registerUser } from '@/lib/auth/user-store';
import { getPostAuthRedirect } from '@/lib/auth/redirect';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const SIGNUP_LIMIT = 5;
const SIGNUP_WINDOW_MS = 60 * 60_000;

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, 'auth-signup', SIGNUP_LIMIT, SIGNUP_WINDOW_MS);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    const next = typeof body.next === 'string' ? body.next : null;

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid input';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const publicUser = await registerUser({ name, email, password });

    const token = signAuthToken({
      userId: publicUser.id,
      email: publicUser.email,
      role: publicUser.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: publicUser,
      token,
      redirectTo: getPostAuthRedirect(publicUser.role, next),
    });
    response.cookies.set(getTokenCookieName(), token, getTokenCookieOptions());
    return response;
  } catch (error) {
    console.error('[auth/signup]', error);
    const message = error instanceof Error ? error.message : 'Unable to create account. Please try again.';
    const status = message.includes('already exists') ? 409 : message.includes('configured') ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
