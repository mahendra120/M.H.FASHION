interface ResendPayload {
  to: string | string[];
  subject: string;
  html: string;
}

async function sendViaResend(payload: ResendPayload, attempt = 1): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() ?? 'M.H.Fashion <noreply@mhfashion.com>';

  if (process.env.NODE_ENV === 'development' && !apiKey) {
    console.log(`[email:dev] To: ${payload.to} | Subject: ${payload.subject}`);
    return;
  }

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      if (res.status >= 500 && attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000));
        return sendViaResend(payload, attempt + 1);
      }
      console.error('[email] Resend error:', err);
      throw new Error('Failed to send email');
    }
  } catch (err) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 1000));
      return sendViaResend(payload, attempt + 1);
    }
    throw err;
  }
}

export async function sendOrderConfirmationEmail(input: {
  to: string;
  orderId: string;
  total: number;
  items: { title: string; quantity: number; price: number }[];
}): Promise<void> {
  const lines = input.items
    .map((i) => `<li>${i.title} × ${i.quantity} — ₹${(i.price * i.quantity).toLocaleString('en-IN')}</li>`)
    .join('');
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://m-h-fashion.vercel.app';

  await sendViaResend({
    to: input.to,
    subject: `Order confirmed — #${input.orderId.slice(0, 8).toUpperCase()}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p>Order ID: <strong>${input.orderId}</strong></p>
      <p>Total: <strong>₹${input.total.toLocaleString('en-IN')}</strong></p>
      <ul>${lines}</ul>
      <p><a href="${site}/order/${input.orderId}">View order</a></p>
    `,
  });
}

export async function sendAdminOrderNotification(input: {
  orderId: string;
  customerEmail: string;
  total: number;
}): Promise<void> {
  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  if (!admins.length) return;

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://m-h-fashion.vercel.app';
  await sendViaResend({
    to: admins,
    subject: `New order — ₹${input.total.toLocaleString('en-IN')}`,
    html: `
      <p>New order received.</p>
      <p>Order: <strong>${input.orderId}</strong></p>
      <p>Customer: ${input.customerEmail}</p>
      <p>Total: ₹${input.total.toLocaleString('en-IN')}</p>
      <p><a href="${site}/admin/orders">View in admin</a></p>
    `,
  });
}
