import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Review } from '@/types';

const DATA_DIR = path.join(process.cwd(), '.data');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

async function readReviews(): Promise<Review[]> {
  try {
    const raw = await fs.readFile(REVIEWS_FILE, 'utf-8');
    return JSON.parse(raw) as Review[];
  } catch {
    return [];
  }
}

async function writeReviews(reviews: Review[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
}

export async function localListReviews(productId: string): Promise<Review[]> {
  const reviews = await readReviews();
  return reviews
    .filter((r) => r.product_id === productId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function localCreateReview(input: {
  product_id: string;
  name: string;
  rating: number;
  title: string;
  body: string;
}): Promise<Review> {
  const reviews = await readReviews();
  const review: Review = {
    id: randomUUID(),
    product_id: input.product_id,
    name: input.name.slice(0, 120),
    rating: Math.round(input.rating),
    title: (input.title ?? '').slice(0, 200),
    body: (input.body ?? '').slice(0, 2000),
    email_hash: null,
    created_at: new Date().toISOString(),
  };
  reviews.unshift(review);
  await writeReviews(reviews);
  return review;
}

export function computeReviewStats(ratings: number[]) {
  if (ratings.length === 0) return { rating: 0, review_count: 0 };
  const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  return {
    rating: Math.round(avg * 10) / 10,
    review_count: ratings.length,
  };
}
