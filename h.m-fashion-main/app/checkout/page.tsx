'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MotionDiv, MotionP } from '@/components/safe-motion';
import { CreditCard, Smartphone, Truck, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/components/providers/cart-provider';
import { useAuth, getClientAuthToken } from '@/components/providers/auth-provider';
import { PublicLayout } from '@/components/layout/public-layout';
import { formatPrice } from '@/lib/format';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AUTH_REQUIRED_MESSAGE, buildLoginUrl } from '@/lib/auth/checkout-intent';
import { useRequireAuthForCheckout } from '@/hooks/use-require-auth-for-checkout';
import type { PaymentMethod } from '@/types';
import Link from 'next/link';

const PAYMENTS: { id: PaymentMethod; label: string; desc: string; icon: any }[] = [
  { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', icon: CreditCard },
  { id: 'upi', label: 'UPI', desc: 'GPay, PhonePe, Paytm', icon: Smartphone },
  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay at your doorstep', icon: Truck },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const { user, loading } = useAuth();
  const requireAuth = useRequireAuthForCheckout();

  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    try {
      setCouponCode(sessionStorage.getItem('mhf_coupon'));
      setDiscount(Number(sessionStorage.getItem('mhf_discount') ?? '0'));
    } catch {
      setCouponCode(null);
      setDiscount(0);
    }
  }, []);

  const shipping = subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : 99;
  const total = Math.max(0, subtotal - discount) + shipping;

  const [method, setMethod] = useState<PaymentMethod>('card');
  const [placing, setPlacing] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);
  const [form, setForm] = useState({
    full_name: user?.name ?? user?.user_metadata?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(buildLoginUrl('/checkout'));
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        full_name: f.full_name || user.name || user.user_metadata?.name || '',
        email: f.email || user.email || '',
      }));
    }
  }, [user]);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) e.phone = '10-digit phone required';
    if (!form.line1.trim()) e.line1 = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.state.trim()) e.state = 'Required';
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = '6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (items.length === 0) { toast.error('Your bag is empty'); return; }
    if (!requireAuth(user, loading, '/checkout')) return;
    if (!validate()) { toast.error('Please complete the form'); return; }
    if (placing) return;
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }
    setPlacing(true);
    try {
      const token = getClientAuthToken();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product_id,
            slug: i.slug,
            title: i.title,
            image: i.image,
            price: i.price,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
          })),
          shipping_address: form,
          payment_method: method,
          coupon_code: couponCode,
          idempotency_key: idempotencyKeyRef.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          typeof data?.error === 'string'
            ? data.error
            : `Order failed (${res.status})`;
        throw new Error(message);
      }
      const { order } = data;
      if (!order?.id) throw new Error('Order was created but no confirmation was returned');
      clear();
      sessionStorage.removeItem('mhf_coupon');
      sessionStorage.removeItem('mhf_discount');
      toast.success('Order placed successfully!');
      router.push(`/order/${order.id}`);
    } catch (e: any) {
      toast.error(e.message ?? 'Could not place order');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <PublicLayout title="Checkout">
        <div className="container-lux py-20 text-center">
          <p className="text-muted-foreground">Your bag is empty — add a piece to checkout.</p>
          <Button asChild variant="lux" size="lg" className="mt-4 rounded-full"><a href="/shop">Browse collection</a></Button>
        </div>
      </PublicLayout>
    );
  }

  if (loading || !user) {
    return (
      <PublicLayout title="Checkout">
        <div className="container-lux flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading…' : AUTH_REQUIRED_MESSAGE}
          </p>
          {!loading && (
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="lux" className="rounded-full">
                <Link href={buildLoginUrl('/checkout')}>Sign in</Link>
              </Button>
              <Button asChild variant="lux-outline" className="rounded-full">
                <Link href={`/signup?next=${encodeURIComponent('/checkout')}`}>Create account</Link>
              </Button>
            </div>
          )}
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout title="Checkout">
      <div className="container-lux grid gap-10 pb-24 lg:grid-cols-[1fr_380px]">
        {/* Form */}
        <div className="space-y-8">
          {/* Shipping */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
              Shipping details
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" value={form.full_name} onChange={(v) => update('full_name', v)} error={errors.full_name} />
              <Field label="Email" value={form.email} onChange={(v) => update('email', v)} error={errors.email} type="email" />
              <Field label="Phone" value={form.phone} onChange={(v) => update('phone', v)} error={errors.phone} placeholder="10-digit mobile" />
              <Field label="Pincode" value={form.pincode} onChange={(v) => update('pincode', v)} error={errors.pincode} placeholder="6 digits" />
              <div className="sm:col-span-2">
                <Field label="Address line 1" value={form.line1} onChange={(v) => update('line1', v)} error={errors.line1} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Address line 2 (optional)" value={form.line2} onChange={(v) => update('line2', v)} />
              </div>
              <Field label="City" value={form.city} onChange={(v) => update('city', v)} error={errors.city} />
              <Field label="State" value={form.state} onChange={(v) => update('state', v)} error={errors.state} />
              <Field label="Country" value={form.country} onChange={(v) => update('country', v)} />
            </div>
          </section>

          {/* Payment */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
              Payment method
            </h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {PAYMENTS.map((p) => {
                const Icon = p.icon;
                const active = method === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setMethod(p.id)}
                    className={cn(
                      'flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition',
                      active ? 'border-accent bg-accent/5 ring-2 ring-accent/20' : 'hover:border-foreground',
                    )}
                  >
                    <Icon className={cn('h-5 w-5', active ? 'text-accent' : 'text-muted-foreground')} />
                    <span className="text-sm font-medium">{p.label}</span>
                    <span className="text-[11px] text-muted-foreground">{p.desc}</span>
                  </button>
                );
              })}
            </div>

            {method === 'card' && (
              <MotionDiv initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><Field label="Card number" value="" onChange={() => {}} placeholder="4242 4242 4242 4242" /></div>
                <Field label="Name on card" value="" onChange={() => {}} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expiry" value="" onChange={() => {}} placeholder="MM/YY" />
                  <Field label="CVV" value="" onChange={() => {}} placeholder="123" />
                </div>
                <p className="sm:col-span-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Lock className="h-3 w-3" /> Encrypted end-to-end. We never store card details.
                </p>
              </MotionDiv>
            )}
            {method === 'upi' && (
              <MotionDiv initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                <Field label="UPI ID" value="" onChange={() => {}} placeholder="yourname@upi" />
              </MotionDiv>
            )}
            {method === 'cod' && (
              <MotionP initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                Pay in cash when your order arrives. A small handling fee of ₹20 applies for COD orders.
              </MotionP>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border bg-card p-6 lux-shadow">
            <h3 className="font-display text-lg font-semibold">Your order</h3>
            <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto">
              {items.map((i) => (
                <li key={`${i.product_id}-${i.size}-${i.color}`} className="flex gap-3">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {i.image && <img src={i.image} alt={i.title} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="line-clamp-1 text-sm font-medium">{i.title}</span>
                    <span className="text-xs text-muted-foreground">{i.size} · {i.color} · Qty {i.quantity}</span>
                    <span className="text-sm font-semibold">{formatPrice(i.price * i.quantity)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t pt-4 text-sm">
              <Row label="Subtotal" value={formatPrice(subtotal)} />
              {discount > 0 && <Row label="Discount" value={`-${formatPrice(discount)}`} accent />}
              <Row label="Shipping" value={shipping === 0 ? 'Free' : formatPrice(shipping)} />
              <div className="flex items-center justify-between border-t pt-3 text-base">
                <dt className="font-semibold">Total payable</dt>
                <dd className="font-display text-xl font-bold">{formatPrice(total)}</dd>
              </div>
            </dl>
            <Button variant="lux" size="lg" className="mt-6 w-full rounded-full" onClick={placeOrder} disabled={placing}>
              {placing ? 'Placing order…' : 'Place order'}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> 100% secure payment · Buyer protection
            </p>
          </div>
        </aside>
      </div>
    </PublicLayout>
  );
}

function Field({
  label, value, onChange, error, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(error && 'border-destructive focus-visible:ring-destructive')}
      />
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('font-medium', accent && 'text-accent')}>{value}</dd>
    </div>
  );
}
