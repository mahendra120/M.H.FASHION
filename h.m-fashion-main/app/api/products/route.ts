import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { slugify } from '@/lib/format';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/app/api/admin/_guard';
import type { ProductInput } from '@/types';

async function requireAdminUser(req: NextRequest) {
  return requireAdmin(req);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!isSupabaseConfigured) {
    if (id) {
      const { DEMO_PRODUCTS } = await import('@/lib/demo-catalog');
      const product = DEMO_PRODUCTS.find((p) => p.id === id) ?? null;
      return NextResponse.json({ product });
    }
    const { queryProducts } = await import('@/lib/catalog');
    const cat = url.searchParams.get('cat') ?? undefined;
    const query = url.searchParams.get('q') ?? undefined;
    const sort = url.searchParams.get('sort') ?? 'new';
    const featured = url.searchParams.get('featured') === 'true' || undefined;
    const newArrival = url.searchParams.get('new') === 'true' || undefined;
    const trending = url.searchParams.get('trending') === 'true' || undefined;
    const limit = Number(url.searchParams.get('limit') ?? 24);
    const page = Number(url.searchParams.get('page') ?? 1);
    const result = await queryProducts({ cat, q: query, sort, featured, newArrival, trending, page, limit });
    return NextResponse.json(result);
  }

  if (id) {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ product: data });
  }

  // filters
  const cat = url.searchParams.get('cat');
  const query = url.searchParams.get('q');
  const sort = url.searchParams.get('sort') ?? 'new';
  const featured = url.searchParams.get('featured');
  const newArrival = url.searchParams.get('new');
  const trending = url.searchParams.get('trending');
  const limit = Number(url.searchParams.get('limit') ?? 24);
  const page = Number(url.searchParams.get('page') ?? 1);

  let q = supabase.from('products').select('*', { count: 'exact' });
  if (cat) q = q.eq('category', cat);
  if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%`);
  if (featured === 'true') q = q.eq('featured', true);
  if (newArrival === 'true') q = q.eq('new_arrival', true);
  if (trending === 'true') q = q.eq('trending', true);

  switch (sort) {
    case 'price-asc': q = q.order('price', { ascending: true }); break;
    case 'price-desc': q = q.order('price', { ascending: false }); break;
    case 'popular': q = q.order('review_count', { ascending: false }); break;
    case 'new':
    default: q = q.order('new_arrival', { ascending: false }).order('created_at', { ascending: false });
  }

  const from = (page - 1) * limit;
  q = q.range(from, from + limit - 1);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data ?? [], total: count ?? 0, page, limit });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminUser(req);
  if (!guard.ok) return guard.response!;

  const body = (await req.json()) as ProductInput;
  if (!body.title || !body.sku) return NextResponse.json({ error: 'title and sku are required' }, { status: 400 });

  const slug = body.slug ?? slugify(body.title);
  const price = Number(body.price);
  const original = body.original_price ? Number(body.original_price) : null;
  const discount = original && original > price ? Math.round(((original - price) / original) * 100) : 0;

  const { data, error } = await supabaseAdmin.from('products').insert({
    slug,
    title: body.title,
    description: body.description ?? '',
    category: body.category,
    images: body.images ?? [],
    price,
    original_price: original,
    discount,
    sizes: body.sizes ?? [],
    colors: body.colors ?? [],
    variants: body.variants ?? ((body.sizes.length || 1) * (body.colors.length || 1) || 1),
    stock: Number(body.stock ?? 0),
    sku: body.sku,
    tags: body.tags ?? [],
    featured: Boolean(body.featured),
    new_arrival: Boolean(body.new_arrival),
    trending: Boolean(body.trending ?? false),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdminUser(req);
  if (!guard.ok) return guard.response!;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const body = await req.json();
  const updates: Record<string, unknown> = { ...body };
  if (updates.slug) updates.slug = slugify(String(updates.slug));
  if (updates.price !== undefined) updates.price = Number(updates.price);
  if (updates.original_price !== undefined) {
    const original = Number(updates.original_price);
    updates.original_price = original || null;
  }
  if (updates.discount === undefined && updates.price !== undefined) {
    const { data } = await supabaseAdmin.from('products').select('price, original_price').eq('id', id).maybeSingle();
    const p = Number(updates.price);
    const o = updates.original_price !== undefined ? (Number(updates.original_price) || null) : data?.original_price ?? null;
    if (o && o > p) updates.discount = Math.round(((o - p) / o) * 100);
  }

  const { data, error } = await supabaseAdmin.from('products').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdminUser(req);
  if (!guard.ok) return guard.response!;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
