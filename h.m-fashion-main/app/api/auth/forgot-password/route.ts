import { NextRequest, NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@/lib/auth/validators';
import { findUserByEmail } from '@/lib/auth/user-store';
import { getJwtSecret } from '@/lib/auth/jwt';
import { sendPasswordResetEmail } from '@/lib/email/send-reset-email';
import { getSiteUrl } from '@/lib/site-url';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import jwt from 'jsonwebtoken';

const RESET_LIMIT = 5;
const RESET_WINDOW_MS = 60 * 60_000;

const RESET_TOKEN_EXPIRY = '15m';

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, 'auth-forgot-password', RESET_LIMIT, RESET_WINDOW_MS);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid input';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { email } = parsed.data;
    const user = await findUserByEmail(email);

    // Always return success to prevent email enumeration
    const genericResponse = NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
    });

    if (!user) {
      return genericResponse;
    }

    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, purpose: 'password-reset' },
      getJwtSecret(),
      { expiresIn: RESET_TOKEN_EXPIRY },
    );

    const resetUrl = `${getSiteUrl()}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (sendError) {
      console.error('[auth/forgot-password] email delivery failed', sendError);
      return NextResponse.json(
        { error: 'Unable to send reset email. Please try again later.' },
        { status: 503 },
      );
    }

    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.',
        resetUrl,
      });
    }

    return genericResponse;
  } catch (error) {
    console.error('[auth/forgot-password]', error);
    return NextResponse.json(
      { error: 'Unable to process request. Please try again.' },
      { status: 500 },
    );
  }
}
