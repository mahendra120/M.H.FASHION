import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { ReviewInput } from '@/types';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const productId = url.searchParams.get('product_id');
  if (!productId) return NextResponse.json({ error: 'product_id required' }, { status: 400 });
  const { data, error } = await supabase
    .from('reviews')
    .select('id, product_id, name, rating, title, body, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ReviewInput;
  if (!body.product_id || !body.name || !body.rating) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
  }

  // Insert review
  const { data: review, error: insertErr } = await supabaseAdmin
    .from('reviews')
    .insert({
      product_id: body.product_id,
      name: body.name.slice(0, 120),
      rating: Math.round(body.rating),
      title: (body.title ?? '').slice(0, 200),
      body: (body.body ?? '').slice(0, 2000),
    })
    .select()
    .single();
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Recompute aggregates — durable, accurate post-insert
  const { data: agg } = await supabaseAdmin
    .rpc('recompute_product_rating', { p_product_id: body.product_id })
    .maybeSingle();

  if (!agg) {
    // fallback path: compute inline
    const { data: list } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('product_id', body.product_id);
    const ratings = (list ?? []).map((r) => r.rating);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    await supabaseAdmin
      .from('products')
      .update({ rating: Math.round(avg * 10) / 10, review_count: ratings.length })
      .eq('id', body.product_id);
  }

  return NextResponse.json({ review });
}
