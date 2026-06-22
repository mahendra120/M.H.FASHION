import { getActiveCategories, queryProducts } from '@/lib/catalog';
import { ShopClient } from './shop-client';

export const revalidate = 60;

export default async function ShopPage() {
  const categories = await getActiveCategories();
  const { products, total } = await queryProducts({ page: 1, limit: 12, sort: 'new' });

  return (
    <ShopClient
      categories={categories}
      initialProducts={products}
      initialTotal={total}
    />
  );
}
