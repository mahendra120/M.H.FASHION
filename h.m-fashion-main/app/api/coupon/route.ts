import { NextRequest, NextResponse } from 'next/server';
import { previewCouponDiscount, CouponError } from '@/lib/coupons';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const COUPON_LIMIT = 20;
const COUPON_WINDOW_MS = 60_000;

export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(req, 'coupon-get', COUPON_LIMIT, COUPON_WINDOW_MS);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const subtotal = Number(url.searchParams.get('subtotal') ?? '0');

  if (!code?.trim()) {
    return NextResponse.json({ error: 'code required' }, { status: 400 });
  }
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ error: 'Invalid subtotal' }, { status: 400 });
  }

  try {
    const result = await previewCouponDiscount(code, subtotal);
    return NextResponse.json({
      coupon: { code: result.code },
      discount: result.discount,
    });
  } catch (err) {
    const message = err instanceof CouponError ? err.message : 'Invalid coupon code';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
