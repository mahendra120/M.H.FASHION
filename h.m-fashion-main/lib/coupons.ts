import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';
import { allowDevFallbacks } from '@/lib/env';

export interface CouponValidationResult {
  discount: number;
  code: string;
}

export class CouponError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CouponError';
  }
}

export async function validateAndApplyCoupon(
  code: string,
  subtotal: number,
  userId: string,
): Promise<CouponValidationResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) throw new CouponError('Invalid coupon code');

  if (!isSupabaseConfigured) {
    if (allowDevFallbacks()) {
      throw new CouponError('Coupons require Supabase in production');
    }
    throw new CouponError('Coupon service unavailable');
  }

  const admin = getSupabaseAdmin();
  const { data: coupon, error } = await admin
    .from('coupons')
    .select('id, code, discount_type, discount_value, min_order, expiry_date, active, usage_limit, used_count')
    .eq('code', normalized)
    .maybeSingle();

  if (error) throw new CouponError('Unable to validate coupon');
  if (!coupon || !coupon.active) throw new CouponError('Invalid coupon code');

  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
    throw new CouponError('Coupon has expired');
  }
  if (subtotal < Number(coupon.min_order ?? 0)) {
    throw new CouponError(`Minimum order ₹${coupon.min_order} required`);
  }
  if (coupon.usage_limit != null && Number(coupon.used_count ?? 0) >= Number(coupon.usage_limit)) {
    throw new CouponError('Coupon usage limit reached');
  }

  const { data: existing } = await admin
    .from('coupon_redemptions')
    .select('id')
    .eq('coupon_code', normalized)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) throw new CouponError('You have already used this coupon');

  const discount =
    coupon.discount_type === 'percent'
      ? Math.round((subtotal * Number(coupon.discount_value)) / 100)
      : Math.min(Number(coupon.discount_value), subtotal);

  return { discount, code: coupon.code };
}

export async function recordCouponRedemption(
  code: string,
  userId: string,
  orderId: string,
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const admin = getSupabaseAdmin();
  const normalized = code.trim().toUpperCase();

  const { error: redeemErr } = await admin.from('coupon_redemptions').insert({
    coupon_code: normalized,
    user_id: userId,
    order_id: orderId,
  });
  if (redeemErr) throw new CouponError('Coupon could not be applied');

  const { data: coupon } = await admin
    .from('coupons')
    .select('used_count')
    .eq('code', normalized)
    .maybeSingle();

  if (coupon) {
    await admin
      .from('coupons')
      .update({ used_count: Number(coupon.used_count ?? 0) + 1 })
      .eq('code', normalized);
  }
}

/** Cart preview — validates coupon fields only (no per-user redemption check). */
export async function previewCouponDiscount(code: string, subtotal: number): Promise<CouponValidationResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) throw new CouponError('Invalid coupon code');

  if (!isSupabaseConfigured) {
    throw new CouponError('Invalid coupon code');
  }

  const admin = getSupabaseAdmin();
  const { data: coupon, error } = await admin
    .from('coupons')
    .select('code, discount_type, discount_value, min_order, expiry_date, active, usage_limit, used_count')
    .eq('code', normalized)
    .maybeSingle();

  if (error || !coupon || !coupon.active) throw new CouponError('Invalid coupon code');
  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
    throw new CouponError('Invalid coupon code');
  }
  if (subtotal < Number(coupon.min_order ?? 0)) {
    throw new CouponError('Invalid coupon code');
  }
  if (coupon.usage_limit != null && Number(coupon.used_count ?? 0) >= Number(coupon.usage_limit)) {
    throw new CouponError('Invalid coupon code');
  }

  const discount =
    coupon.discount_type === 'percent'
      ? Math.round((subtotal * Number(coupon.discount_value)) / 100)
      : Math.min(Number(coupon.discount_value), subtotal);

  return { discount, code: coupon.code };
}
