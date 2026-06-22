import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '../_guard';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;

  const { data, error } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ banners: data ?? [] });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;
  const body = await req.json();
  const { data, error } = await supabaseAdmin.from('banners').insert({
    title: body.title,
    image: body.image ?? '',
    link: body.link ?? '',
    active: body.active ?? true,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ banner: data });
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const body = await req.json();
  const { data, error } = await supabaseAdmin.from('banners').update(body).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ banner: data });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('banners').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
