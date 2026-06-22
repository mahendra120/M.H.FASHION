'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Minus, Plus, ShoppingBag, Star, Truck, RefreshCw, ShieldCheck, ZoomIn, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import { useCart } from '@/components/providers/cart-provider';
import { useWishlist } from '@/components/providers/wishlist-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { formatPrice, discountPercent } from '@/lib/format';
import { COLOR_SWATCHES, FREE_SHIPPING_THRESHOLD, CATEGORY_LABELS } from '@/lib/constants';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Product, Review } from '@/types';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion';
import { saveBuyNowIntent, consumeBuyNowIntent } from '@/lib/auth/checkout-intent';
import { useRequireAuthForCheckout } from '@/hooks/use-require-auth-for-checkout';

export function ProductDetailClient({
  product,
  reviews,
  related,
}: {
  product: Product;
  reviews: Review[];
  related: Product[];
}) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { user, loading } = useAuth();
  const router = useRouter();
  const requireAuth = useRequireAuthForCheckout();
  const liked = has(product.id);

  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState(product.sizes[0] ?? 'One Size');
  const [color, setColor] = useState(product.colors[0] ?? 'Default');
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [tab, setTab] = useState<'desc' | 'reviews'>('desc');
  const [reviewsState, setReviewsState] = useState(reviews);

  const likedHeart = useRef<HTMLSpanElement>(null);
  const discount = discountPercent(product.price, product.original_price);
  const inStock = product.stock > 0;

  // recently viewed
  useEffect(() => {
    try {
      const raw = localStorage.getItem('mhf_recent');
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = [product.id, ...list.filter((id) => id !== product.id)].slice(0, 8);
      localStorage.setItem('mhf_recent', JSON.stringify(next));
    } catch {}
  }, [product.id]);

  // Restore buy-now flow after login
  useEffect(() => {
    if (!user || loading) return;
    const intent = consumeBuyNowIntent(product.slug);
    if (!intent) return;
    setSize(intent.size);
    setColor(intent.color);
    setQty(intent.quantity);
    add(product, { size: intent.size, color: intent.color, quantity: intent.quantity });
    router.push('/checkout');
  }, [user, loading, product, add, router]);

  const onAdd = () => {
    if (!inStock) { toast.error('Currently out of stock'); return; }
    add(product, { size, color, quantity: qty });
    toast.success('Added to bag', { description: `${product.title} — ${size} · ${color}` });
  };

  const onBuyNow = () => {
    if (!inStock) { toast.error('Currently out of stock'); return; }
    if (!requireAuth(user, loading, `/product/${product.slug}`)) {
      saveBuyNowIntent({ slug: product.slug, size, color, quantity: qty });
      return;
    }
    add(product, { size, color, quantity: qty });
    router.push('/checkout');
  };

  const ratingBreakdown = useMemo(() => {
    const buckets = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviewsState.filter((r) => r.rating === star).length,
    }));
    return buckets;
  }, [reviewsState]);

  const submitReview = async (data: { name: string; rating: number; title: string; body: string }) => {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id, ...data }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      toast.error(err?.error ?? 'Could not submit review');
      return;
    }
    const { review } = await res.json();
    setReviewsState((prev) => [review, ...prev]);
    toast.success('Thank you — your review is live');
  };

  return (
    <div className="container-lux pb-24 pt-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href={`/shop?cat=${product.category}`} className="hover:text-foreground">
          {CATEGORY_LABELS[product.category as keyof typeof CATEGORY_LABELS] ?? product.category}
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div className="flex flex-col gap-3 lg:flex-row-reverse">
          <div
            className="relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-2xl bg-muted"
            onClick={() => setZoom(true)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImage}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={product.images[activeImage]}
                  alt={product.title}
                  fill
                  priority
                  sizes="(max-width:1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/80 px-3 py-1 text-[10px] text-muted-foreground backdrop-blur">
              <ZoomIn className="h-3 w-3" /> Click to zoom
            </div>
            {product.images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i - 1 + product.images.length) % product.images.length); }}
                  className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/80 backdrop-blur hover:scale-110"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i + 1) % product.images.length); }}
                  className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/80 backdrop-blur hover:scale-110"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 lg:flex-col">
              {product.images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-lg bg-muted transition lg:w-20',
                    activeImage === i ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : 'opacity-60 hover:opacity-100',
                  )}
                >
                  <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="relative">
          <div className="flex items-center gap-2">
            {product.new_arrival && <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent">New</span>}
            {product.trending && <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">Trending</span>}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{product.title}</h1>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={cn('h-3.5 w-3.5', i < Math.round(product.rating) ? 'fill-accent text-accent' : 'text-muted-foreground')} />
              ))}
            </div>
            <button onClick={() => setTab('reviews')} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
              {product.review_count} reviews
            </button>
          </div>

          <div className="mt-5 flex items-end gap-3">
            <span className="font-display text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.original_price && product.original_price > product.price && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">Save {discount}%</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes · SKU {product.sku}</p>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          {/* Color */}
          {product.colors.length > 0 && (
            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.15em]">Color</span>
                <span className="text-xs text-muted-foreground">{color}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={c}
                    className={cn(
                      'h-9 w-9 rounded-full border-2 transition',
                      color === c ? 'border-accent ring-2 ring-accent/30' : 'border-border hover:scale-110',
                    )}
                    style={{ background: COLOR_SWATCHES[c] ?? '#ccc' }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {product.sizes.length > 0 && (
            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.15em]">Size</span>
                <button className="text-xs text-muted-foreground underline-offset-2 hover:underline">Size guide</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={cn(
                      'min-w-12 rounded-full border px-4 py-2 text-sm transition',
                      size === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-foreground',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty + actions */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-border">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-12 w-12 place-items-center hover:text-accent" aria-label="Decrease quantity">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-medium">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))} className="grid h-12 w-12 place-items-center hover:text-accent" aria-label="Increase quantity">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => toggle(product)} aria-label="Wishlist">
                <motion.span ref={likedHeart} animate={{ scale: liked ? [1, 1.4, 1] : 1 }} transition={{ duration: 0.4 }}>
                  <Heart className={cn('h-5 w-5', liked && 'fill-destructive text-destructive')} />
                </motion.span>
              </Button>
            </div>
            <div className="flex flex-1 gap-3">
              <Button variant="lux-outline" size="lg" className="flex-1 rounded-full" onClick={onAdd} disabled={!inStock}>
                <ShoppingBag className="h-4 w-4" />
                {inStock ? 'Add to bag' : 'Out of stock'}
              </Button>
              <Button variant="lux" size="lg" className="flex-1 rounded-full" onClick={onBuyNow} disabled={!inStock}>
                <Zap className="h-4 w-4" />
                Buy now
              </Button>
            </div>
          </div>

          {/* Stock / shipping notice */}
          <div className="mt-5 space-y-2 text-xs text-muted-foreground">
            <p className={inStock ? 'text-success' : 'text-destructive'}>
              {inStock ? `● In stock — ${product.stock} left` : '● Currently unavailable'}
            </p>
            <p className="flex items-center gap-2"><Truck className="h-3.5 w-3.5" /> Free shipping on orders above {formatPrice(FREE_SHIPPING_THRESHOLD)}</p>
            <p className="flex items-center gap-2"><RefreshCw className="h-3.5 w-3.5" /> 30-day easy returns</p>
            <p className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Secure, encrypted checkout</p>
          </div>

          {product.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {product.tags.map((t) => (
                <Link key={t} href={`/shop?q=${t}`} className="rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground">
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs: description / reviews */}
      <div className="mt-20">
        <div className="flex gap-6 border-b">
          <TabButton active={tab === 'desc'} onClick={() => setTab('desc')}>Details</TabButton>
          <TabButton active={tab === 'reviews'} onClick={() => setTab('reviews')}>
            Reviews ({reviewsState.length})
          </TabButton>
        </div>
        <div className="py-8">
          {tab === 'desc' ? (
            <Reveal className="prose prose-sm max-w-2xl">
              <p className="leading-relaxed text-muted-foreground">{product.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>Premium material — designed to wear and wash beautifully.</li>
                <li>Model is 178cm and wears size {size}.</li>
                <li>Ships in 24h · Easy 30-day returns.</li>
              </ul>
            </Reveal>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
              {/* Summary */}
              <div>
                <div className="flex items-center gap-4">
                  <p className="font-display text-5xl font-bold">{product.rating.toFixed(1)}</p>
                  <div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn('h-4 w-4', i < Math.round(product.rating) ? 'fill-accent text-accent' : 'text-muted')} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Based on {reviewsState.length} reviews</p>
                  </div>
                </div>
                <div className="mt-6 space-y-1.5">
                  {ratingBreakdown.map((b) => (
                    <div key={b.star} className="flex items-center gap-2">
                      <span className="w-4 text-xs">{b.star}</span>
                      <Star className="h-3 w-3 fill-muted text-muted" />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-accent" style={{ width: `${reviewsState.length ? (b.count / reviewsState.length) * 100 : 0}%` }} />
                      </div>
                      <span className="w-4 text-right text-xs text-muted-foreground">{b.count}</span>
                    </div>
                  ))}
                </div>
                <ReviewForm onSubmit={submitReview} />
              </div>

              {/* Reviews list */}
              <div>
                <StaggerGroup className="space-y-5">
                  {reviewsState.length === 0 ? (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No reviews yet. Be the first to share your thoughts.
                    </p>
                  ) : (
                    reviewsState.map((r) => (
                      <StaggerItem key={r.id}>
                        <div className="rounded-2xl border p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{r.name}</p>
                              <p className="text-xs text-muted-foreground">{r.title || 'Verified buyer'}</p>
                            </div>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={cn('h-3.5 w-3.5', i < r.rating ? 'fill-accent text-accent' : 'text-muted')} />
                              ))}
                            </div>
                          </div>
                          {r.title && <p className="mt-2 text-sm font-semibold">{r.title}</p>}
                          <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                        </div>
                      </StaggerItem>
                    ))
                  )}
                </StaggerGroup>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <Reveal>
            <h2 className="mb-8 font-display text-2xl font-bold sm:text-3xl">You may also like</h2>
          </Reveal>
          <StaggerGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p, i) => (
              <StaggerItem key={p.id}>
                <ProductCard product={p} index={i} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>
      )}

      {/* Zoom modal */}
      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setZoom(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative h-[80vh] aspect-[4/5]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={product.images[activeImage]} alt={product.title} fill sizes="80vh" className="object-contain" />
            </motion.div>
            <button className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white" onClick={() => setZoom(false)}>
              <Plus className="h-6 w-6 rotate-45" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn('relative -mb-px border-b-2 px-1 py-3 text-sm font-medium transition', active ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
      {children}
    </button>
  );
}

function ReviewForm({ onSubmit }: { onSubmit: (data: { name: string; rating: number; title: string; body: string }) => Promise<void> }) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSubmitting(true);
        await onSubmit({ name, rating, title, body });
        setSubmitting(false);
        setName(''); setTitle(''); setBody(''); setRating(5);
      }}
      className="mt-8 rounded-2xl border p-5"
    >
      <h3 className="font-display text-lg font-semibold">Write a review</h3>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onClick={() => setRating(s)}>
            <Star className={cn('h-5 w-5 transition', s <= rating ? 'fill-accent text-accent' : 'text-muted')} />
          </button>
        ))}
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-3 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Review title" className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your experience…" rows={3} className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
      <Button type="submit" variant="lux" size="sm" className="mt-3 rounded-full" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit review'}
      </Button>
    </form>
  );
}
