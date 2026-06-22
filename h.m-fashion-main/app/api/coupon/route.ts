import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const subtotal = Number(url.searchParams.get('subtotal') ?? '0');
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('id, code, discount_type, discount_value, min_order, expiry_date, active')
    .eq('code', code.toUpperCase())
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
  if (!coupon.active) return NextResponse.json({ error: 'Coupon inactive' }, { status: 400 });
  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
    return NextResponse.json({ error: 'Coupon expired' }, { status: 400 });
  }
  if (subtotal < Number(coupon.min_order)) {
    return NextResponse.json({ error: `Minimum order ₹${coupon.min_order} required` }, { status: 400 });
  }

  const value = coupon.discount_type === 'percent'
    ? Math.round((subtotal * Number(coupon.discount_value)) / 100)
    : Math.min(Number(coupon.discount_value), subtotal);

  return NextResponse.json({ coupon, discount: value });
}
