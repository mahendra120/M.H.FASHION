'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Search, X, PackageSearch } from 'lucide-react';
import { useCart } from '@/components/providers/cart-provider';
import { ProductCard } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/components/layout/public-layout';
import { Reveal } from '@/components/motion';
import { formatPrice } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Product, Category } from '@/types';

const SORTS = [
  { value: 'new', label: 'New arrivals' },
  { value: 'popular', label: 'Popularity' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

const PRICE_BANDS = [
  { value: '0-999', label: 'Under ₹999' },
  { value: '1000-1499', label: '₹1000 - ₹1499' },
  { value: '1500-2499', label: '₹1500 - ₹2499' },
  { value: '2500-999999', label: 'Above ₹2500' },
];

const INFINITE_PAGE = 12;

function inPriceBand(price: number, band: string) {
  const [min, max] = band.split('-').map(Number);
  return price >= min && price <= max;
}

export function ShopClient({
  categories,
  initialProducts,
  initialTotal,
}: {
  categories: Category[];
  initialProducts: Product[];
  initialTotal: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cat = searchParams.get('cat') ?? '';
  const q = searchParams.get('q') ?? '';
  const sortInitial = searchParams.get('sort') ?? 'new';
  const newFlag = searchParams.get('new') === 'true';
  const trending = searchParams.get('trending') === 'true';

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(sortInitial);
  const [priceBand, setPriceBand] = useState<string>('');
  const [query, setQuery] = useState(q);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Reset state when route-derived params change
  useEffect(() => {
    setProducts(initialProducts);
    setTotal(initialTotal);
    setPage(1);
    setQuery(q);
  }, [cat, q, initialProducts, initialTotal]);

  // Fetch with all filters
  const fetchProducts = async (pageNum: number, append: boolean) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cat) params.set('cat', cat);
    if (query) params.set('q', query);
    if (newFlag) params.set('new', 'true');
    if (trending) params.set('trending', 'true');
    params.set('sort', sort);
    params.set('page', String(pageNum));
    params.set('limit', String(INFINITE_PAGE));
    try {
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      let filtered = data.products as Product[];
      if (priceBand) filtered = filtered.filter((p) => inPriceBand(p.price, priceBand));
      setProducts((prev) => (append ? [...prev, ...filtered] : filtered));
      setTotal(data.total);
      setPage(pageNum);
    } catch (e: any) {
      toast.error(e.message ?? 'Could not load products');
    } finally {
      setLoading(false);
    }
  };

  // Refetch on filter change (except on infinite load-more)
  useEffect(() => {
    fetchProducts(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, query, sort, sortInitial, newFlag, trending, priceBand]);

  // URL sync helper
  const updateURL = (next: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.replace(`/shop?${params.toString()}`);
  };

  const loadMore = () => fetchProducts(page + 1, true);
  const hasMore = products.length < total;

  const setCat = (slug: string) => updateURL({ cat: slug, page: '' });
  const setSortURL = (val: string) => {
    setSort(val);
    updateURL({ sort: val });
  };

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === cat)?.name ?? (q ? `Search: ${q}` : 'All products'),
    [cat, q, categories],
  );

  return (
    <PublicLayout title={activeCategory}>
      <div className="container-lux pb-24">
        {/* Toolbar */}
        <div className="mb-8 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen((v) => !v)} className="lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
            <p className="text-sm text-muted-foreground">{total} pieces</p>
          </div>
          <div className="flex items-center gap-3">
            <form
              onSubmit={(e) => { e.preventDefault(); updateURL({ q: query }); }}
              className="hidden items-center gap-2 rounded-full border px-4 py-2 sm:flex"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-40 bg-transparent text-sm outline-none"
              />
              {query && <button type="button" onClick={() => { setQuery(''); updateURL({ q: '' }); }}><X className="h-3.5 w-3.5" /></button>}
            </form>
            <select
              value={sort}
              onChange={(e) => setSortURL(e.target.value)}
              className="rounded-full border bg-background px-4 py-2 text-sm outline-none"
            >
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar — desktop */}
          <aside className="hidden lg:block">
            <FilterPanel
              categories={categories}
              activeCat={cat}
              onCat={setCat}
              priceBand={priceBand}
              onPrice={setPriceBand}
              onClear={() => { setPriceBand(''); updateURL({ cat: '', q: '' }); }}
            />
          </aside>

          {/* Mobile filter drawer */}
          <AnimatePresence>
            {filtersOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] bg-background/60 backdrop-blur lg:hidden"
                  onClick={() => setFiltersOpen(false)}
                />
                <motion.div
                  initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                  transition={{ type: 'spring', stiffness: 320, damping: 36 }}
                  className="fixed inset-y-0 left-0 z-[65] w-80 max-w-[85%] overflow-y-auto bg-card p-5 lg:hidden"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-display text-lg font-semibold">Filters</span>
                    <Button variant="ghost" size="icon" onClick={() => setFiltersOpen(false)}><X className="h-5 w-5" /></Button>
                  </div>
                  <FilterPanel
                    categories={categories}
                    activeCat={cat}
                    onCat={(c) => { setCat(c); setFiltersOpen(false); }}
                    priceBand={priceBand}
                    onPrice={setPriceBand}
                    onClear={() => { setPriceBand(''); updateURL({ cat: '', q: '' }); }}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Grid */}
          <div>
            {loading && products.length === 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState onReset={() => { setPriceBand(''); updateURL({ cat: '', q: '' }); }} />
            ) : (
              <>
                <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {products.map((p, i) => (
                      <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <ProductCard product={p} index={i} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
                {hasMore && (
                  <div className="mt-12 flex justify-center">
                    <Button variant="lux-outline" size="lg" onClick={loadMore} disabled={loading} className="rounded-full">
                      {loading ? 'Loading…' : 'Load more'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

function FilterPanel({
  categories,
  activeCat,
  onCat,
  priceBand,
  onPrice,
  onClear,
}: {
  categories: Category[];
  activeCat: string;
  onCat: (slug: string) => void;
  priceBand: string;
  onPrice: (band: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em]">Category</h3>
          <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
        </div>
        <div className="flex flex-col gap-1.5">
          <FilterRow active={!activeCat} label="All" onClick={() => onCat('')} />
          {categories.map((c) => (
            <FilterRow key={c.id} active={activeCat === c.slug} label={c.name} onClick={() => onCat(c.slug)} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]">Price</h3>
        <div className="flex flex-col gap-1.5">
          <FilterRow active={!priceBand} label="Any price" onClick={() => onPrice('')} />
          {PRICE_BANDS.map((b) => (
            <FilterRow key={b.value} active={priceBand === b.value} label={b.label} onClick={() => onPrice(b.value)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterRow({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition',
        active ? 'bg-accent/10 font-medium text-accent' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <Reveal>
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed py-24 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-muted">
          <PackageSearch className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold">No pieces match</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Try adjusting the filters — every drop is limited, so the collection shifts quickly.
          </p>
        </div>
        <Button onClick={onReset} variant="lux-outline" size="sm" className="rounded-full">Reset filters</Button>
      </div>
    </Reveal>
  );
}
