'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/providers/cart-provider';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants';
import { formatPrice } from '@/lib/format';

export function CartDrawer() {
  const { items, isOpen, setOpen, updateQty, remove, subtotal } = useCart();

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 100 : (subtotal / FREE_SHIPPING_THRESHOLD) * 100;

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-[90] bg-background/60 backdrop-blur-sm"
      />
      <aside className="fixed right-0 top-0 z-[95] flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <ShoppingBag className="h-4 w-4" /> Bag ({items.length})
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close cart">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {items.length > 0 && (
          <div className="border-b px-5 py-3">
            <p className="mb-2 text-xs text-muted-foreground">
              {remaining > 0 ? (
                <>You are <span className="font-semibold text-foreground">{formatPrice(remaining)}</span> from free shipping</>
              ) : (
                <span className="font-medium text-success">You unlocked free shipping</span>
              )}
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-muted">
                <ShoppingBag className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium">Your bag is empty</p>
              <p className="text-sm text-muted-foreground">Discover the new season before it sells out.</p>
              <Button asChild variant="lux" size="sm" className="mt-2 rounded-full">
                <Link href="/shop" onClick={() => setOpen(false)}>Browse the collection</Link>
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-4 py-2">
              {items.map((item) => (
                <li key={`${item.product_id}-${item.size}-${item.color}`} className="flex gap-3">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <Link href={`/product/${item.slug}`} onClick={() => setOpen(false)} className="line-clamp-2 text-sm font-medium hover:text-accent">
                        {item.title}
                      </Link>
                      <button onClick={() => remove(item.product_id, item.size, item.color)} className="text-muted-foreground hover:text-destructive" aria-label="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.size} · {item.color}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-border">
                        <button onClick={() => updateQty(item.product_id, item.size, item.color, item.quantity - 1)} className="grid h-8 w-8 place-items-center hover:text-accent" aria-label="Decrease">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product_id, item.size, item.color, item.quantity + 1)} className="grid h-8 w-8 place-items-center hover:text-accent" aria-label="Increase">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <Button asChild variant="lux" size="lg" className="w-full rounded-full">
              <Link href="/cart" onClick={() => setOpen(false)}>View bag & checkout</Link>
            </Button>
            <button onClick={() => setOpen(false)} className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground">
              Continue shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
