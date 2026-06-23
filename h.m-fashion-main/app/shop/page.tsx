import { getActiveCategories, queryProducts } from '@/lib/catalog';
import { ShopClient } from './shop-client';

export const revalidate = 60;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { cat?: string; q?: string; sort?: string; new?: string; trending?: string };
}) {
  const cat = searchParams.cat ?? '';
  const q = searchParams.q ?? '';
  const sort = searchParams.sort ?? 'new';
  const newFlag = searchParams.new === 'true';
  const trending = searchParams.trending === 'true';

  const categories = await getActiveCategories();
  const { products, total } = await queryProducts({
    page: 1,
    limit: 12,
    sort,
    cat: cat || undefined,
    q: q || undefined,
    newArrival: newFlag || undefined,
    trending: trending || undefined,
  });

  return (
    <ShopClient
      categories={categories}
      initialProducts={products}
      initialTotal={total}
      initialCat={cat}
      initialQ={q}
      initialSort={sort}
      initialNew={newFlag}
      initialTrending={trending}
    />
  );
}
