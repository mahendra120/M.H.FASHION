import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  DEMO_BANNERS,
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  getDemoProductBySlug,
  queryDemoProducts,
  type ProductQuery,
} from '@/lib/demo-catalog';
import { localListReviews, computeReviewStats } from '@/lib/reviews-local-store';
import { optimizeImageUrl, IMAGE_WIDTHS } from '@/lib/image-utils';
import type { Banner, Category, Product, Review } from '@/types';

/** Columns needed for product cards / list views — avoids shipping full rows. */
const PRODUCT_LIST_SELECT =
  'id, slug, title, category, images, price, original_price, discount, sizes, colors, variants, stock, sku, tags, rating, review_count, featured, new_arrival, trending, created_at';

const HOME_SECTION_LIMIT = 4;

/** Trim payload for list/card views: fewer images, no long descriptions. */
function stripProductForList(product: Product): Product {
  return {
    ...product,
    description: '',
    images: product.images.slice(0, 2),
  };
}

function stripProductsForList(products: Product[]): Product[] {
  return products.map(stripProductForList);
}

function optimizeCategory(cat: Category): Category {
  return { ...cat, image: optimizeImageUrl(cat.image, IMAGE_WIDTHS.category) };
}

function optimizeBanner(banner: Banner): Banner {
  return { ...banner, image: optimizeImageUrl(banner.image, IMAGE_WIDTHS.hero) };
}

export async function getActiveCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return DEMO_CATEGORIES.map(optimizeCategory);
  const { data } = await supabase
    .from('categories')
    .select('id, slug, name, image, status, sort_order')
    .eq('status', 'active')
    .order('sort_order', { ascending: true });
  return ((data ?? []) as Category[]).map(optimizeCategory);
}

export async function getActiveBanners(): Promise<Banner[]> {
  if (!isSupabaseConfigured) return DEMO_BANNERS.map(optimizeBanner);
  const { data } = await supabase
    .from('banners')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });
  return ((data ?? []) as Banner[]).map(optimizeBanner);
}

export async function getHomePageData() {
  if (!isSupabaseConfigured) {
    const featured = stripProductsForList(DEMO_PRODUCTS.filter((p) => p.featured).slice(0, HOME_SECTION_LIMIT));
    const bestSellers = stripProductsForList(
      [...DEMO_PRODUCTS].sort((a, b) => b.review_count - a.review_count).slice(0, HOME_SECTION_LIMIT),
    );
    const newArrivals = stripProductsForList(DEMO_PRODUCTS.filter((p) => p.new_arrival).slice(0, HOME_SECTION_LIMIT));
    const trending = stripProductsForList(DEMO_PRODUCTS.filter((p) => p.trending).slice(0, HOME_SECTION_LIMIT));
    return {
      featured,
      bestSellers,
      newArrivals,
      trending,
      categories: DEMO_CATEGORIES.map(optimizeCategory),
      banners: DEMO_BANNERS.slice(0, 1).map(optimizeBanner),
    };
  }

  const [featured, bestSellers, newArrivals, trending, categories, banners] = await Promise.all([
    supabase.from('products').select(PRODUCT_LIST_SELECT).eq('featured', true).limit(HOME_SECTION_LIMIT),
    supabase.from('products').select(PRODUCT_LIST_SELECT).order('review_count', { ascending: false }).limit(HOME_SECTION_LIMIT),
    supabase.from('products').select(PRODUCT_LIST_SELECT).eq('new_arrival', true).order('created_at', { ascending: false }).limit(HOME_SECTION_LIMIT),
    supabase.from('products').select(PRODUCT_LIST_SELECT).eq('trending', true).limit(HOME_SECTION_LIMIT),
    supabase.from('categories').select('id, slug, name, image, status, sort_order').eq('status', 'active').order('sort_order', { ascending: true }),
    supabase.from('banners').select('id, title, image, link, active').eq('active', true).order('created_at', { ascending: false }).limit(1),
  ]);

  return {
    featured: stripProductsForList((featured.data ?? []) as Product[]),
    bestSellers: stripProductsForList((bestSellers.data ?? []) as Product[]),
    newArrivals: stripProductsForList((newArrivals.data ?? []) as Product[]),
    trending: stripProductsForList((trending.data ?? []) as Product[]),
    categories: ((categories.data ?? []) as Category[]).map(optimizeCategory),
    banners: ((banners.data ?? []) as Banner[]).map(optimizeBanner),
  };
}

export async function queryProducts(opts: ProductQuery) {
  if (!isSupabaseConfigured) return queryDemoProducts(opts);

  const { cat, q, sort = 'new', featured, newArrival, trending, page = 1, limit = 24 } = opts;
  let query = supabase.from('products').select(PRODUCT_LIST_SELECT, { count: 'exact' });
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
  return { products: stripProductsForList((data ?? []) as Product[]), total: count ?? 0, page, limit };
}

export async function getProductBySlug(slug: string) {
  if (!isSupabaseConfigured) {
    const product = getDemoProductBySlug(slug);
    if (!product) return null;
    const reviews = await localListReviews(product.id);
    const stats = computeReviewStats(reviews.map((r) => r.rating));
    const related = DEMO_PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
    return {
      product: { ...product, ...stats },
      reviews,
      related,
    };
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
  try {
    const { data, error } = await supabase.from('products').select('slug');
    if (error || !data?.length) return DEMO_PRODUCTS.map((p) => ({ slug: p.slug }));
    return data;
  } catch {
    return DEMO_PRODUCTS.map((p) => ({ slug: p.slug }));
  }
}
