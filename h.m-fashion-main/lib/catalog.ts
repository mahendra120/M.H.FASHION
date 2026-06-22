import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  DEMO_BANNERS,
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  getDemoProductBySlug,
  queryDemoProducts,
  type ProductQuery,
} from '@/lib/demo-catalog';
import type { Banner, Category, Product, Review } from '@/types';

export async function getActiveCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return DEMO_CATEGORIES;
  const { data } = await supabase
    .from('categories')
    .select('id, slug, name, image, status, sort_order')
    .eq('status', 'active')
    .order('sort_order', { ascending: true });
  return (data ?? []) as Category[];
}

export async function getActiveBanners(): Promise<Banner[]> {
  if (!isSupabaseConfigured) return DEMO_BANNERS;
  const { data } = await supabase
    .from('banners')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });
  return (data ?? []) as Banner[];
}

export async function getHomePageData() {
  if (!isSupabaseConfigured) {
    const featured = DEMO_PRODUCTS.filter((p) => p.featured).slice(0, 8);
    const bestSellers = [...DEMO_PRODUCTS].sort((a, b) => b.review_count - a.review_count).slice(0, 8);
    const newArrivals = DEMO_PRODUCTS.filter((p) => p.new_arrival).slice(0, 8);
    const trending = DEMO_PRODUCTS.filter((p) => p.trending).slice(0, 8);
    return {
      featured,
      bestSellers,
      newArrivals,
      trending,
      categories: DEMO_CATEGORIES,
      banners: DEMO_BANNERS,
    };
  }

  const [featured, bestSellers, newArrivals, trending, categories, banners] = await Promise.all([
    supabase.from('products').select('*').eq('featured', true).limit(8),
    supabase.from('products').select('*').order('review_count', { ascending: false }).limit(8),
    supabase.from('products').select('*').eq('new_arrival', true).order('created_at', { ascending: false }).limit(8),
    supabase.from('products').select('*').eq('trending', true).limit(8),
    supabase.from('categories').select('*').eq('status', 'active').order('sort_order', { ascending: true }),
    supabase.from('banners').select('*').eq('active', true).order('created_at', { ascending: false }),
  ]);

  return {
    featured: (featured.data ?? []) as Product[],
    bestSellers: (bestSellers.data ?? []) as Product[],
    newArrivals: (newArrivals.data ?? []) as Product[],
    trending: (trending.data ?? []) as Product[],
    categories: (categories.data ?? []) as Category[],
    banners: (banners.data ?? []) as Banner[],
  };
}

export async function queryProducts(opts: ProductQuery) {
  if (!isSupabaseConfigured) return queryDemoProducts(opts);

  const { cat, q, sort = 'new', featured, newArrival, trending, page = 1, limit = 24 } = opts;
  let query = supabase.from('products').select('*', { count: 'exact' });
  if (cat) query = query.eq('category', cat);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,sku.ilike.%${q}%`);
  if (featured) query = query.eq('featured', true);
  if (newArrival) query = query.eq('new_arrival', true);
  if (trending) query = query.eq('trending', true);

  switch (sort) {
    case 'price-asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('price', { ascending: false });
      break;
    case 'popular':
      query = query.order('review_count', { ascending: false });
      break;
    case 'new':
    default:
      query = query.order('new_arrival', { ascending: false }).order('created_at', { ascending: false });
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { products: (data ?? []) as Product[], total: count ?? 0, page, limit };
}

export async function getProductBySlug(slug: string) {
  if (!isSupabaseConfigured) {
    const product = getDemoProductBySlug(slug);
    if (!product) return null;
    const related = DEMO_PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
    return { product, reviews: [] as Review[], related };
  }

  const { data: product } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
  if (!product) return null;
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, product_id, name, rating, title, body, created_at')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false });
  const { data: related } = await supabase
    .from('products')
    .select('*')
    .eq('category', product.category)
    .neq('id', product.id)
    .limit(4);
  return {
    product: product as Product,
    reviews: (reviews ?? []) as Review[],
    related: (related ?? []) as Product[],
  };
}

export async function getAllProductSlugs() {
  if (!isSupabaseConfigured) return DEMO_PRODUCTS.map((p) => ({ slug: p.slug }));
  const { data } = await supabase.from('products').select('slug');
  return data ?? [];
}
