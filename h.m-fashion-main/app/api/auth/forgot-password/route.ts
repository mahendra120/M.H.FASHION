import { NextRequest, NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@/lib/auth/validators';
import { findUserByEmail } from '@/lib/auth/user-store';
import { getJwtSecret } from '@/lib/auth/jwt';
import jwt from 'jsonwebtoken';

const RESET_TOKEN_EXPIRY = '15m';

export async function POST(req: NextRequest) {
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
      message: 'If an account exists with that email, a reset link has been generated.',
    });

    if (!user) {
      return genericResponse;
    }

    // Generate a password reset token (signed JWT with short expiry)
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, purpose: 'password-reset' },
      getJwtSecret(),
      { expiresIn: RESET_TOKEN_EXPIRY },
    );

    const origin = req.headers.get('origin') || req.nextUrl.origin;
    const resetUrl = `${origin}/reset-password?token=${resetToken}`;

    // In development, log the reset link to the server console
    if (process.env.NODE_ENV === 'development') {
      console.log('\n╔══════════════════════════════════════════════════════╗');
      console.log('║           PASSWORD RESET LINK (DEV ONLY)             ║');
      console.log('╠══════════════════════════════════════════════════════╣');
      console.log(`║ Email: ${user.email}`);
      console.log(`║ Link:  ${resetUrl}`);
      console.log('║ Expires in 15 minutes                                ║');
      console.log('╚══════════════════════════════════════════════════════╝\n');
    }

    // In production, you would send an email here using your SMTP service.
    // Example: await sendResetEmail(user.email, resetUrl);

    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a reset link has been generated.',
      // Only include the reset URL in development for easy testing
      ...(process.env.NODE_ENV === 'development' ? { resetUrl } : {}),
    });
  } catch (error) {
    console.error('[auth/forgot-password]', error);
    return NextResponse.json(
      { error: 'Unable to process request. Please try again.' },
      { status: 500 },
    );
  }
}
