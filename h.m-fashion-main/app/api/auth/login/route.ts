import { NextRequest, NextResponse } from 'next/server';
import { signAuthToken, getTokenCookieName, getTokenCookieOptions } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/auth/validators';
import { authenticateUser, useLocalUserStore } from '@/lib/auth/user-store';
import { getPostAuthRedirect } from '@/lib/auth/redirect';
import { authLog } from '@/lib/auth/debug';
import { isMongoConfigured } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
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
      // #region agent log
      fetch('http://127.0.0.1:7900/ingest/090f6d38-5b88-4583-9648-35b5d5060acb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e47377'},body:JSON.stringify({sessionId:'e47377',location:'login/route.ts:fail',message:'login failed',data:{store:useLocalUserStore()?'local':isMongoConfigured()?'mongodb':'none',hasAdminEmails:Boolean(process.env.ADMIN_EMAILS)},timestamp:Date.now(),hypothesisId:'H1-H4'})}).catch(()=>{});
      // #endregion
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
