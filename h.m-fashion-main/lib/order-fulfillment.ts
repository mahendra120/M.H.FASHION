import type { OrderStatus, PaymentMethod } from '@/types';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

const FULFILLMENT_STATUSES: OrderStatus[] = ['processing', 'shipped', 'delivered'];

export function canFulfillOrder(order: {
  payment_method: PaymentMethod;
  payment_status?: PaymentStatus;
  order_status: OrderStatus;
}): { ok: boolean; reason?: string } {
  const paymentStatus = order.payment_status ?? 'pending';

  if (paymentStatus === 'failed') {
    return { ok: false, reason: 'Payment failed — order cannot be fulfilled' };
  }

  if (order.payment_method !== 'cod' && paymentStatus !== 'paid') {
    return { ok: false, reason: 'Payment not confirmed — cannot process or ship this order' };
  }

  return { ok: true };
}

export function assertFulfillmentAllowed(
  order: { payment_method: PaymentMethod; payment_status?: PaymentStatus; order_status: OrderStatus },
  nextStatus: OrderStatus,
): void {
  if (!FULFILLMENT_STATUSES.includes(nextStatus)) return;
  const check = canFulfillOrder(order);
  if (!check.ok) throw new Error(check.reason ?? 'Order cannot be fulfilled');
}
