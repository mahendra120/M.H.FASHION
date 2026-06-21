import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordSchema } from '@/lib/auth/validators';
import { updateUserPasswordById } from '@/lib/auth/user-store';
import { getJwtSecret } from '@/lib/auth/jwt';
import jwt from 'jsonwebtoken';

interface ResetPayload {
  userId: string;
  email: string;
  purpose: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid input';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { token, password } = parsed.data;

    // Verify the reset token
    let payload: ResetPayload;
    try {
      payload = jwt.verify(token, getJwtSecret()) as ResetPayload;
    } catch {
      return NextResponse.json(
        { error: 'Reset link is invalid or has expired. Please request a new one.' },
        { status: 400 },
      );
    }

    // Ensure this is a password-reset token, not a regular auth token
    if (payload.purpose !== 'password-reset') {
      return NextResponse.json(
        { error: 'Invalid reset token.' },
        { status: 400 },
      );
    }

    // Update the password
    const updated = await updateUserPasswordById(payload.userId, password);
    if (!updated) {
      return NextResponse.json(
        { error: 'Account not found. Please contact support.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in.',
    });
  } catch (error) {
    console.error('[auth/reset-password]', error);
    return NextResponse.json(
      { error: 'Unable to reset password. Please try again.' },
      { status: 500 },
    );
  }
}
