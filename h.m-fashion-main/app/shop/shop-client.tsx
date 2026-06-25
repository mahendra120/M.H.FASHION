'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronRight,
  Home,
  PackageSearch,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/components/layout/public-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ShopLoading } from './shop-loading';
import type { Product, Category } from '@/types';

const SORTS = [
  { value: 'new', label: 'New arrivals' },
  { value: 'popular', label: 'Popularity' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

const PRICE_BANDS = [
  { value: '0-999', label: 'Under ₹999' },
  { value: '1000-1499', label: '₹1000 – ₹1499' },
  { value: '1500-2499', label: '₹1500 – ₹2499' },
  { value: '2500-999999', label: 'Above ₹2500' },
];

const INFINITE_PAGE = 12;

function inPriceBand(price: number, band: string) {
  const [min, max] = band.split('-').map(Number);
  return price >= min && price <= max;
}

export function ShopClient(props: {
  categories: Category[];
  initialProducts: Product[];
  initialTotal: number;
  initialCat?: string;
  initialQ?: string;
  initialSort?: string;
  initialNew?: boolean;
  initialTrending?: boolean;
}) {
  return (
    <Suspense fallback={<ShopLoading />}>
      <ShopClientInner {...props} />
    </Suspense>
  );
}

function ShopClientInner({
  categories,
  initialProducts,
  initialTotal,
  initialCat = '',
  initialQ = '',
  initialSort = 'new',
  initialNew = false,
  initialTrending = false,
}: {
  categories: Category[];
  initialProducts: Product[];
  initialTotal: number;
  initialCat?: string;
  initialQ?: string;
  initialSort?: string;
  initialNew?: boolean;
  initialTrending?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cat = searchParams.get('cat') ?? initialCat;
  const q = searchParams.get('q') ?? initialQ;
  const newFlag = searchParams.get('new') === 'true' || initialNew;
  const trending = searchParams.get('trending') === 'true' || initialTrending;
  const urlSort = searchParams.get('sort') ?? initialSort;

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(urlSort);
  const [priceBand, setPriceBand] = useState('');
  const [query, setQuery] = useState(q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const skipInitialFetch = useRef(true);

  useEffect(() => {
    setSort(urlSort);
  }, [urlSort]);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === cat),
    [cat, categories],
  );

  const pageTitle = activeCategory?.name ?? (q ? `Results for “${q}”` : 'All products');
  const pageDescription = activeCategory
    ? `Curated ${activeCategory.name.toLowerCase()} from our latest drops — limited runs, premium finishes.`
    : q
      ? 'Pieces matching your search across the full collection.'
      : 'Explore the full M.H.Fashion collection — tees, hoodies, caps, covers and posters.';

  useEffect(() => {
    setProducts(initialProducts);
    setTotal(initialTotal);
    setPage(1);
    setSort(urlSort);
    setQuery(q);
    skipInitialFetch.current = true;
  }, [cat, q, urlSort, newFlag, trending, initialProducts, initialTotal]);

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
      setTotal(priceBand ? filtered.length : data.total);
      setPage(pageNum);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      if (!priceBand) return;
    }
    fetchProducts(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, query, sort, newFlag, trending, priceBand]);

  const updateURL = (next: Record<string, string>) => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    Object.entries(next).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.replace(`/shop?${params.toString()}`);
  };

  const loadMore = () => fetchProducts(page + 1, true);
  const hasMore = !priceBand && products.length < total;

  const setCat = (slug: string) => updateURL({ cat: slug });
  const setSortURL = (val: string) => {
    setSort(val);
    updateURL({ sort: val });
  };

  const clearAll = () => {
    setPriceBand('');
    updateURL({ cat: '', q: '' });
  };

  const activeFilters = [
    cat && activeCategory ? { key: 'cat', label: activeCategory.name, clear: () => setCat('') } : null,
    q ? { key: 'q', label: `“${q}”`, clear: () => { setQuery(''); updateURL({ q: '' }); } } : null,
    priceBand
      ? {
          key: 'price',
          label: PRICE_BANDS.find((b) => b.value === priceBand)?.label ?? 'Price',
          clear: () => setPriceBand(''),
        }
      : null,
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  return (
    <PublicLayout>
      {/* Page hero */}
      <section className="border-b bg-gradient-to-b from-secondary/60 to-background">
        <div className="container-lux py-8 lg:py-10">
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="inline-flex items-center gap-1 transition hover:text-foreground">
              <Home className="h-3.5 w-3.5" /> Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 opacity-40" />
            <Link href="/shop" className={cn('transition hover:text-foreground', !cat && !q && 'font-medium text-foreground')}>
              Shop
            </Link>
            {activeCategory && (
              <>
                <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                <span className="font-medium text-foreground">{activeCategory.name}</span>
              </>
            )}
            {q && !activeCategory && (
              <>
                <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                <span className="font-medium text-foreground">Search</span>
              </>
            )}
          </nav>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Collection</p>
              <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{pageTitle}</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{pageDescription}</p>
              <p className="mt-4 text-sm font-medium text-foreground/80">
                {loading && products.length === 0 ? 'Loading…' : `${total} piece${total === 1 ? '' : 's'}`}
              </p>
            </div>

            {activeCategory?.image && (
              <div className="relative hidden h-28 w-44 shrink-0 overflow-hidden rounded-2xl border shadow-sm lg:block">
                <Image
                  src={activeCategory.image}
                  alt={activeCategory.name}
                  fill
                  sizes="176px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            )}
          </div>

          {/* Category quick pills */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <CategoryPill active={!cat} label="All" onClick={() => setCat('')} />
            {categories.map((c) => (
              <CategoryPill key={c.id} active={cat === c.slug} label={c.name} onClick={() => setCat(c.slug)} />
            ))}
          </div>
        </div>
      </section>

      <div className="container-lux pb-24 pt-8">
        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen(true)}
              className="rounded-full lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
            {activeFilters.length > 0 && (
              <div className="hidden flex-wrap items-center gap-2 sm:flex">
                {activeFilters.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={f.clear}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium transition hover:border-accent/40 hover:bg-accent/5"
                  >
                    {f.label}
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
                <button type="button" onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground">
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateURL({ q: query });
              }}
              className="flex flex-1 items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm sm:max-w-xs"
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    updateURL({ q: '' });
                  }}
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </form>
            <select
              value={sort}
              onChange={(e) => setSortURL(e.target.value)}
              className="rounded-full border bg-card px-4 py-2 text-sm shadow-sm outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-[7.5rem] rounded-2xl border bg-card p-5 shadow-sm">
              <FilterPanel
                categories={categories}
                activeCat={cat}
                onCat={setCat}
                priceBand={priceBand}
                onPrice={setPriceBand}
                onClear={clearAll}
              />
            </div>
          </aside>

          {filtersOpen && (
            <>
              <div
                className="fixed inset-0 z-[60] bg-background/60 backdrop-blur lg:hidden"
                onClick={() => setFiltersOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 z-[65] w-80 max-w-[85%] overflow-y-auto bg-card p-5 shadow-xl lg:hidden">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-display text-lg font-semibold">Filters</span>
                    <Button variant="ghost" size="icon" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <FilterPanel
                    categories={categories}
                    activeCat={cat}
                    onCat={(slug) => {
                      setCat(slug);
                      setFiltersOpen(false);
                    }}
                    priceBand={priceBand}
                    onPrice={setPriceBand}
                    onClear={() => {
                      clearAll();
                      setFiltersOpen(false);
                    }}
                  />
                </div>
              </>
            )}

          <div>
            {loading && products.length === 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState onReset={clearAll} />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-3">
                  {products.map((p, i) => (
                    <ProductCard key={p.id} product={p} priority={i < 3} />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-12 flex justify-center">
                    <Button
                      variant="lux-outline"
                      size="lg"
                      onClick={loadMore}
                      disabled={loading}
                      className="rounded-full min-w-[160px]"
                    >
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

function CategoryPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border/70 bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground',
      )}
    >
      {label}
    </button>
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
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">Category</h3>
          <button type="button" onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">
            Reset
          </button>
        </div>
        <div className="flex flex-col gap-1">
          <FilterRow active={!activeCat} label="All products" onClick={() => onCat('')} />
          {categories.map((c) => (
            <FilterRow key={c.id} active={activeCat === c.slug} label={c.name} onClick={() => onCat(c.slug)} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-foreground">Price</h3>
        <div className="flex flex-col gap-1">
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
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition',
        active
          ? 'bg-primary/8 font-medium text-foreground ring-1 ring-primary/20'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
      )}
    >
      <span
        className={cn(
          'grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition',
          active ? 'border-primary bg-primary' : 'border-border',
        )}
      >
        {active && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
      </span>
      {label}
    </button>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed bg-secondary/20 py-24 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-muted">
        <PackageSearch className="h-7 w-7 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-display text-xl font-semibold">No pieces match</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Try a different category or price range — every drop is limited.
        </p>
      </div>
      <Button onClick={onReset} variant="lux-outline" size="sm" className="rounded-full">
        Reset filters
      </Button>
    </div>
  );
}
