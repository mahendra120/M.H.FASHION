import { NextRequest, NextResponse } from 'next/server';
import { getPublicUserFromRequest } from '@/lib/auth/session';
import { addWishlistItem, listWishlist, removeWishlistItem, toggleWishlistItem } from '@/lib/wishlist';
import type { Product } from '@/types';

type WishlistProductInput = Pick<Product, 'id' | 'slug' | 'title' | 'price' | 'images'>;

function parseProduct(body: unknown): WishlistProductInput | null {
  if (!body || typeof body !== 'object') return null;
  const p = body as Partial<WishlistProductInput>;
  if (!p.id || !p.slug || !p.title || typeof p.price !== 'number') return null;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    images: Array.isArray(p.images) ? p.images : [],
  };
}

function toProduct(input: WishlistProductInput): Product {
  return {
    ...input,
    description: '',
    category: '',
    original_price: null,
    discount: 0,
    sizes: [],
    colors: [],
    variants: 0,
    stock: 0,
    sku: '',
    tags: [],
    rating: 0,
    review_count: 0,
    featured: false,
    new_arrival: false,
    trending: false,
    created_at: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getPublicUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Sign in to view your wishlist' }, { status: 401 });
    }

    const items = await listWishlist(user.id);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('[api/wishlist GET]', error);
    return NextResponse.json({ error: 'Unable to load wishlist' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getPublicUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Sign in to save items' }, { status: 401 });
    }

    const body = await req.json();
    const product = parseProduct(body.product);
    if (!product) {
      return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
    }

    const action = body.action === 'add' ? 'add' : 'toggle';

    if (action === 'add') {
      const items = await addWishlistItem(user.id, toProduct(product));
      return NextResponse.json({ items, added: true });
    }

    const result = await toggleWishlistItem(user.id, toProduct(product));
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/wishlist POST]', error);
    return NextResponse.json({ error: 'Unable to update wishlist' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getPublicUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Sign in to update your wishlist' }, { status: 401 });
    }

    const productId = new URL(req.url).searchParams.get('product_id');
    if (!productId) {
      return NextResponse.json({ error: 'product_id required' }, { status: 400 });
    }

    const items = await removeWishlistItem(user.id, productId);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('[api/wishlist DELETE]', error);
    return NextResponse.json({ error: 'Unable to remove item' }, { status: 500 });
  }
}
