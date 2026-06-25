import type { OrderItem } from '@/types';

export const MAX_LINE_QUANTITY = 20;
export const MAX_CART_LINES = 30;

export function parseQuantity(raw: unknown): number {
  const qty = Number(raw);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_LINE_QUANTITY) {
    throw new Error(`Quantity must be an integer between 1 and ${MAX_LINE_QUANTITY}`);
  }
  return qty;
}

export function validateOrderItems(items: unknown): OrderItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Your cart is empty');
  }
  if (items.length > MAX_CART_LINES) {
    throw new Error(`Maximum ${MAX_CART_LINES} line items per order`);
  }

  return items.map((raw, index) => {
    if (!raw || typeof raw !== 'object') {
      throw new Error(`Invalid line item at position ${index + 1}`);
    }
    const item = raw as Partial<OrderItem>;
    if (!item.product_id || typeof item.product_id !== 'string') {
      throw new Error(`Missing product_id on line ${index + 1}`);
    }
    if (!item.slug || typeof item.slug !== 'string') {
      throw new Error(`Missing slug on line ${index + 1}`);
    }
    const quantity = parseQuantity(item.quantity);
    return {
      product_id: item.product_id.trim(),
      slug: item.slug.trim(),
      title: String(item.title ?? '').slice(0, 200),
      image: String(item.image ?? '').slice(0, 2000),
      price: Number(item.price ?? 0),
      quantity,
      size: String(item.size ?? '').slice(0, 40),
      color: String(item.color ?? '').slice(0, 40),
    };
  });
}
