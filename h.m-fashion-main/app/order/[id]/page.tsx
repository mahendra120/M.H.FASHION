import { notFound } from 'next/navigation';
import { PublicLayout } from '@/components/layout/public-layout';
import { OrderConfirmationClient } from './order-client';
import { canUserAccessOrder } from '@/lib/auth/order-access';
import { getPublicUserFromCookies } from '@/lib/auth/session';
import { getOrderById } from '@/lib/orders';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);
  if (!order) notFound();

  const viewer = await getPublicUserFromCookies();
  if (!viewer) notFound();

  const allowed = canUserAccessOrder(order, {
    userId: viewer.id,
    email: viewer.email,
    isAdmin: viewer.role === 'admin',
  });
  if (!allowed) notFound();

  return (
    <PublicLayout>
      <OrderConfirmationClient order={order} />
    </PublicLayout>
  );
}
