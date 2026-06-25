/**
 * Password-reset email delivery.
 * Production: Resend HTTP API when RESEND_API_KEY is set.
 * Development: logs link to server console (no external service required).
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() ?? 'M.H.Fashion <noreply@mhfashion.com>';

  if (process.env.NODE_ENV === 'development' && !apiKey) {
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║           PASSWORD RESET LINK (DEV ONLY)             ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║ Email: ${to}`);
    console.log(`║ Link:  ${resetUrl}`);
    console.log('║ Expires in 15 minutes                                ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    return;
  }

  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY is not configured. Set RESEND_API_KEY and EMAIL_FROM in production to enable password reset emails.',
    );
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Reset your M.H.Fashion password',
      html: `
        <p>You requested a password reset for your M.H.Fashion account.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 15 minutes. If you did not request this, you can ignore this email.</p>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`Failed to send reset email: ${err}`);
  }
}
