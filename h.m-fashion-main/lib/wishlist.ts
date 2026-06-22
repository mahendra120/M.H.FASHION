import { connectDB, isMongoConfigured } from '@/lib/mongodb';
import { Wishlist, type IWishlistDocument } from '@/models/Wishlist';
import {
  localAddWishlist,
  localListWishlist,
  localRemoveWishlist,
  localToggleWishlist,
} from '@/lib/wishlist-local-store';
import type { Product, WishlistItem } from '@/types';

export function useLocalWishlistStore(): boolean {
  return !isMongoConfigured() && process.env.NODE_ENV === 'development';
}

function mongoToItem(doc: IWishlistDocument): WishlistItem {
  return {
    product_id: doc.product_id,
    slug: doc.slug,
    title: doc.title,
    image: doc.image,
    price: doc.price,
    added_at: doc.added_at.toISOString(),
  };
}

function productToItem(product: Product): WishlistItem {
  return {
    product_id: product.id,
    slug: product.slug,
    title: product.title,
    image: product.images[0] ?? '',
    price: product.price,
    added_at: new Date().toISOString(),
  };
}

export async function listWishlist(userId: string): Promise<WishlistItem[]> {
  if (useLocalWishlistStore()) return localListWishlist(userId);

  if (!isMongoConfigured()) return [];

  await connectDB();
  const docs = await Wishlist.find({ user_id: userId }).sort({ added_at: -1 });
  return docs.map(mongoToItem);
}

export async function addWishlistItem(userId: string, product: Product): Promise<WishlistItem[]> {
  const item = productToItem(product);

  if (useLocalWishlistStore()) return localAddWishlist(userId, item);

  if (!isMongoConfigured()) return [];

  await connectDB();
  await Wishlist.updateOne(
    { user_id: userId, product_id: product.id },
    { $setOnInsert: { ...item, added_at: new Date() } },
    { upsert: true },
  );
  return listWishlist(userId);
}

export async function removeWishlistItem(userId: string, productId: string): Promise<WishlistItem[]> {
  if (useLocalWishlistStore()) return localRemoveWishlist(userId, productId);

  if (!isMongoConfigured()) return [];

  await connectDB();
  await Wishlist.deleteOne({ user_id: userId, product_id: productId });
  return listWishlist(userId);
}

export async function toggleWishlistItem(
  userId: string,
  product: Product,
): Promise<{ added: boolean; items: WishlistItem[] }> {
  const item = productToItem(product);

  if (useLocalWishlistStore()) return localToggleWishlist(userId, item);

  if (!isMongoConfigured()) return { added: false, items: [] };

  await connectDB();
  const existing = await Wishlist.findOne({ user_id: userId, product_id: product.id });
  if (existing) {
    await Wishlist.deleteOne({ _id: existing._id });
    return { added: false, items: await listWishlist(userId) };
  }

  await Wishlist.create({ ...item, user_id: userId, added_at: new Date() });
  return { added: true, items: await listWishlist(userId) };
}
