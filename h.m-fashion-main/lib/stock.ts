import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';
import { allowDevFallbacks } from '@/lib/env';

export class InsufficientStockError extends Error {
  constructor(productId: string, title?: string) {
    super(title ? `Insufficient stock for ${title}` : `Insufficient stock for product ${productId}`);
    this.name = 'InsufficientStockError';
  }
}

/**
 * Atomically decrement stock. Throws if insufficient stock or product missing.
 * Requires migration 20260626060000_atomic_stock_and_coupon_limits.sql applied.
 */
export async function decrementStockAtomic(productId: string, qty: number, title?: string): Promise<void> {
  if (qty <= 0) throw new Error('Stock quantity must be positive');

  if (productId.startsWith('demo-')) {
    if (allowDevFallbacks()) return;
    throw new Error('Demo products are not available in production');
  }

  if (!isSupabaseConfigured) {
    if (allowDevFallbacks()) return;
    throw new Error('Catalog database is not configured');
  }

  const { data, error } = await getSupabaseAdmin().rpc('decrement_stock_if_available', {
    p_product_id: productId,
    p_qty: qty,
  });

  if (error) {
    if (error.message?.includes('insufficient_stock')) {
      throw new InsufficientStockError(productId, title);
    }
    throw new Error(`Stock update failed: ${error.message}`);
  }

  if (data !== true) {
    throw new InsufficientStockError(productId, title);
  }
}

/** Restore stock after a failed order (best-effort). */
export async function restoreStock(productId: string, qty: number): Promise<void> {
  if (qty <= 0 || productId.startsWith('demo-') || !isSupabaseConfigured) return;
  try {
    await getSupabaseAdmin().rpc('increment_stock', { p_product_id: productId, p_qty: qty });
  } catch (err) {
    console.error('[stock] restore failed:', productId, err);
  }
}
