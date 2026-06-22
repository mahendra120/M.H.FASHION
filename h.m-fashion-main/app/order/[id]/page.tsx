import { notFound } from 'next/navigation';
import { PublicLayout } from '@/components/layout/public-layout';
import { OrderConfirmationClient } from './order-client';
import { getOrderById } from '@/lib/orders';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);
  if (!order) notFound();
  return (
    <PublicLayout>
      <OrderConfirmationClient order={order} />
    </PublicLayout>
  );
}
