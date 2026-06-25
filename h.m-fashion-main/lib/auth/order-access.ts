import type { Order } from '@/types';

/** True when the authenticated user may view this order confirmation. */
export function canUserAccessOrder(
  order: Pick<Order, 'user_id' | 'user_email'>,
  viewer: { userId: string; email: string; isAdmin: boolean },
): boolean {
  if (viewer.isAdmin) return true;
  if (order.user_id && order.user_id === viewer.userId) return true;
  if (
    order.user_email &&
    order.user_email.toLowerCase() === viewer.email.toLowerCase()
  ) {
    return true;
  }
  return false;
}
