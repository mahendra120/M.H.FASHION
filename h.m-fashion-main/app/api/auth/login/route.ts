import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signAuthToken, getTokenCookieName, getTokenCookieOptions } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/auth/validators';
import { authenticateUser } from '@/lib/auth/user-store';
import { getPostAuthRedirect } from '@/lib/auth/redirect';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    const next = typeof body.next === 'string' ? body.next : null;

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid input';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const publicUser = await authenticateUser(email, password);

    if (!publicUser) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signAuthToken({
      userId: publicUser.id,
      email: publicUser.email,
      role: publicUser.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Signed in successfully',
      user: publicUser,
      token,
      redirectTo: getPostAuthRedirect(publicUser.role, next),
    });
    response.cookies.set(getTokenCookieName(), token, getTokenCookieOptions());
    return response;
  } catch (error) {
    console.error('[auth/login]', error);
    const message = error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
