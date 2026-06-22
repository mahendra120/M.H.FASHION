import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, product_id, name, rating, title, body, created_at')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false });

  const { data: related } = await supabase
    .from('products')
    .select('id, slug, title, description, images, price, original_price, discount, sizes, colors, rating, review_count, featured, new_arrival, trending, category, stock, sku, tags, created_at')
    .eq('category', product.category)
    .neq('id', product.id)
    .limit(8);

  return NextResponse.json({ product, reviews: reviews ?? [], related: related ?? [] });
}
