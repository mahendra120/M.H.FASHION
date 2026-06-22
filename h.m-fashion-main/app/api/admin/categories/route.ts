import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '../_guard';
import { slugify } from '@/lib/format';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;
  const body = await req.json();
  const slug = body.slug ?? slugify(body.name);
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({
      slug,
      name: body.name,
      image: body.image ?? '',
      status: body.status ?? 'active',
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const body = await req.json();
  const updates = { ...body };
  if (updates.name && !updates.slug) updates.slug = slugify(updates.name);
  const { data, error } = await supabaseAdmin.from('categories').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
