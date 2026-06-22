import { promises as fs } from 'fs';
import path from 'path';
import type { WishlistItem } from '@/types';

const DATA_DIR = path.join(process.cwd(), '.data');
const WISHLIST_FILE = path.join(DATA_DIR, 'wishlist.json');

interface StoredWishlistRow extends WishlistItem {
  user_id: string;
}

async function readRows(): Promise<StoredWishlistRow[]> {
  try {
    const raw = await fs.readFile(WISHLIST_FILE, 'utf-8');
    return JSON.parse(raw) as StoredWishlistRow[];
  } catch {
    return [];
  }
}

async function writeRows(rows: StoredWishlistRow[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(WISHLIST_FILE, JSON.stringify(rows, null, 2), 'utf-8');
}

function toItem(row: StoredWishlistRow): WishlistItem {
  return {
    product_id: row.product_id,
    slug: row.slug,
    title: row.title,
    image: row.image,
    price: row.price,
    added_at: row.added_at,
  };
}

export async function localListWishlist(userId: string): Promise<WishlistItem[]> {
  const rows = await readRows();
  return rows
    .filter((r) => r.user_id === userId)
    .sort((a, b) => b.added_at.localeCompare(a.added_at))
    .map(toItem);
}

export async function localAddWishlist(
  userId: string,
  item: WishlistItem,
): Promise<WishlistItem[]> {
  const rows = await readRows();
  const exists = rows.some((r) => r.user_id === userId && r.product_id === item.product_id);
  if (!exists) {
    rows.push({ ...item, user_id: userId });
    await writeRows(rows);
  }
  return localListWishlist(userId);
}

export async function localRemoveWishlist(userId: string, productId: string): Promise<WishlistItem[]> {
  const rows = await readRows();
  const next = rows.filter((r) => !(r.user_id === userId && r.product_id === productId));
  await writeRows(next);
  return localListWishlist(userId);
}

export async function localToggleWishlist(
  userId: string,
  item: WishlistItem,
): Promise<{ added: boolean; items: WishlistItem[] }> {
  const rows = await readRows();
  const index = rows.findIndex((r) => r.user_id === userId && r.product_id === item.product_id);
  if (index === -1) {
    rows.push({ ...item, user_id: userId });
    await writeRows(rows);
    return { added: true, items: await localListWishlist(userId) };
  }
  rows.splice(index, 1);
  await writeRows(rows);
  return { added: false, items: await localListWishlist(userId) };
}
