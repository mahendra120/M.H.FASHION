'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MotionDiv, MotionLi, SafeAnimatePresence } from '@/components/safe-motion';
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2, X, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/components/providers/cart-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { PublicLayout } from '@/components/layout/public-layout';
import { formatPrice } from '@/lib/format';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants';
import { toast } from 'sonner';
import { useRequireAuthForCheckout } from '@/hooks/use-require-auth-for-checkout';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQty, remove, subtotal, clear } = useCart();
  const { user, loading } = useAuth();
  const requireAuth = useRequireAuthForCheckout();
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shipping = subtotal === 0 || subtotal - appliedDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : 99;
  const total = Math.max(0, subtotal - appliedDiscount) + shipping;

  const applyCoupon = async () => {
    if (!couponCode) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/coupon?code=${encodeURIComponent(couponCode)}&subtotal=${subtotal}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Invalid coupon');
      setAppliedDiscount(data.discount);
      setAppliedCode(data.coupon.code);
      toast.success(`Coupon applied — you saved ${formatPrice(data.discount)}`);
    } catch (e: any) {
      toast.error(e.message ?? 'Could not apply coupon');
      setAppliedDiscount(0);
      setAppliedCode(null);
    } finally {
      setApplying(false);
    }
  };

  const startCheckout = () => {
    if (appliedCode) sessionStorage.setItem('mhf_coupon', appliedCode);
    sessionStorage.setItem('mhf_discount', String(appliedDiscount));
  };

  const proceedToCheckout = () => {
    startCheckout();
    if (!requireAuth(user, loading, '/checkout')) return;
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <PublicLayout title="Your bag">
        <div className="container-lux flex flex-col items-center justify-center gap-5 py-24 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-muted">
            <ShoppingBag className="h-9 w-9 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Your bag is empty</h2>
            <p className="mt-1 text-sm text-muted-foreground">Every drop is limited — explore before it sells out.</p>
          </div>
          <Button asChild variant="lux" size="lg" className="rounded-full">
            <Link href="/shop">Start shopping <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout title="Your bag">
      <div className="container-lux grid gap-10 pb-24 lg:grid-cols-[1fr_380px]">
        {/* Items */}
        <div>
          {/* Free shipping indicator */}
          <div className="mb-6 rounded-2xl border bg-card p-4">
            <div className="mb-2 flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-accent" />
              {remaining > 0 ? (
                <span>You are <span className="font-semibold">{formatPrice(remaining)}</span> away from free shipping</span>
              ) : (
                <span className="font-medium text-success">Free shipping unlocked</span>
              )}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <MotionDiv
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-accent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">{items.length} item{items.length > 1 ? 's' : ''}</h2>
            <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive">Clear bag</button>
          </div>

          <ul className="mt-4 flex flex-col gap-4">
            <SafeAnimatePresence>
              {items.map((item) => (
                <MotionLi
                  key={`${item.product_id}-${item.size}-${item.color}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="flex gap-4 rounded-2xl border bg-card p-3"
                >
                  <Link href={`/product/${item.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.image && <Image src={item.image} alt={item.title} fill sizes="96px" className="object-cover" />}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-medium hover:text-accent">
                        {item.title}
                      </Link>
                      <button onClick={() => remove(item.product_id, item.size, item.color)} className="text-muted-foreground hover:text-destructive" aria-label="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.size} · {item.color}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-full border">
                        <button onClick={() => updateQty(item.product_id, item.size, item.color, item.quantity - 1)} className="grid h-8 w-8 place-items-center hover:text-accent" aria-label="Decrease">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product_id, item.size, item.color, item.quantity + 1)} className="grid h-8 w-8 place-items-center hover:text-accent" aria-label="Increase">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </MotionLi>
              ))}
            </SafeAnimatePresence>
          </ul>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border bg-card p-6 lux-shadow">
            <h3 className="font-display text-lg font-semibold">Order summary</h3>

            {/* Coupon */}
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Coupon code</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="WELCOME10"
                    className="pl-9 uppercase"
                  />
                </div>
                <Button variant="lux-outline" size="sm" onClick={applyCoupon} disabled={applying}>
                  {applying ? 'Applying…' : 'Apply'}
                </Button>
              </div>
              {appliedCode && (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-accent/10 px-3 py-2 text-xs">
                  <span className="font-medium text-accent">{appliedCode} applied</span>
                  <button
                    onClick={() => { setAppliedCode(null); setAppliedDiscount(0); setCouponCode(''); }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">Try <span className="font-medium">WELCOME10</span>, <span className="font-medium">MHF250</span> or <span className="font-medium">FESTIVE25</span></p>
            </div>

            <dl className="mt-5 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatPrice(subtotal)}</dd>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-accent">
                  <dt>Discount</dt>
                  <dd>-{formatPrice(appliedDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-medium">{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd>
              </div>
              <div className="flex items-center justify-between border-t pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-xl font-bold">{formatPrice(total)}</dd>
              </div>
            </dl>

            <Button variant="lux" size="lg" className="mt-6 w-full rounded-full" onClick={proceedToCheckout}>
              Proceed to checkout <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Secure encrypted checkout · 30-day returns</p>
          </div>
        </aside>
      </div>
    </PublicLayout>
  );
}
