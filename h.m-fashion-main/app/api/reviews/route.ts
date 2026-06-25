import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { allowDevFallbacks } from '@/lib/env';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import {
  localCreateReview,
  localListReviews,
  computeReviewStats,
} from '@/lib/reviews-local-store';
import type { ReviewInput } from '@/types';

const REVIEW_LIMIT = 10;
const REVIEW_WINDOW_MS = 60 * 60_000;

function useLocalReviews(): boolean {
  if (!allowDevFallbacks()) return false;
  if (!isSupabaseConfigured) return true;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const productId = url.searchParams.get('product_id');
  if (!productId) return NextResponse.json({ error: 'product_id required' }, { status: 400 });

  if (useLocalReviews()) {
    const reviews = await localListReviews(productId);
    return NextResponse.json({ reviews });
  }

  const { supabase } = await import('@/lib/supabase');
  const { data, error } = await supabase
    .from('reviews')
    .select('id, product_id, name, rating, title, body, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, 'reviews-post', REVIEW_LIMIT, REVIEW_WINDOW_MS);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  const body = (await req.json()) as ReviewInput;
  if (!body.product_id || !body.name || !body.rating) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
  }

  if (useLocalReviews()) {
    try {
      const review = await localCreateReview({
        product_id: body.product_id,
        name: body.name,
        rating: body.rating,
        title: body.title ?? '',
        body: body.body ?? '',
      });
      return NextResponse.json({ review });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save review';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const supabaseAdmin = getSupabaseAdmin();
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

  const { data: agg } = await supabaseAdmin
    .rpc('recompute_product_rating', { p_product_id: body.product_id })
    .maybeSingle();

  if (!agg) {
    const { data: list } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('product_id', body.product_id);
    const ratings = (list ?? []).map((r) => r.rating);
    const stats = computeReviewStats(ratings);
    await supabaseAdmin
      .from('products')
      .update(stats)
      .eq('id', body.product_id);
  }

  return NextResponse.json({ review });
}
