import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '../_guard';

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;
  const body = await req.json();
  const { data, error } = await supabaseAdmin.from('coupons').insert({
    code: body.code.toUpperCase(),
    discount_type: body.discount_type,
    discount_value: Number(body.discount_value),
    min_order: Number(body.min_order ?? 0),
    expiry_date: body.expiry_date ?? null,
    active: body.active ?? true,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupon: data });
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const body = await req.json();
  const updates: Record<string, unknown> = { ...body };
  if (updates.code) updates.code = String(updates.code).toUpperCase();
  if (updates.discount_value !== undefined) updates.discount_value = Number(updates.discount_value);
  if (updates.min_order !== undefined) updates.min_order = Number(updates.min_order);
  const { data, error } = await supabaseAdmin.from('coupons').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupon: data });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;

  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupons: data ?? [] });
}
