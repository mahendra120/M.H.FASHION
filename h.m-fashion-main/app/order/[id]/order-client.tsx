'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Package, Truck, Home, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/lib/format';
import type { Order } from '@/types';
import { toast } from 'sonner';

export function OrderConfirmationClient({ order }: { order: Order }) {
  const total = Number(order.total_amount);
  const sub = Number(order.subtotal);
  const disc = Number(order.discount);
  const ship = Number(order.shipping);

  const steps = [
    { label: 'Order placed', date: formatDate(order.created_at), complete: true },
    { label: 'Processing', date: 'Within 24h', complete: order.order_status !== 'pending' },
    { label: 'Shipped', date: '1-2 days', complete: ['shipped', 'delivered'].includes(order.order_status) },
    { label: 'Delivered', date: '3-5 days', complete: order.order_status === 'delivered' },
  ];

  return (
    <div className="container-lux py-16">
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success text-white"
      >
        <Check className="h-9 w-9" strokeWidth={3} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-center"
      >
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Thank you for your order</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A confirmation has been sent to <span className="font-medium text-foreground">{order.shipping_address.email}</span>
        </p>
      </motion.div>

      <div className="mx-auto mt-8 flex max-w-md items-center justify-between gap-2 rounded-full border bg-card px-4 py-2 text-sm">
        <span className="text-muted-foreground">Order ID</span>
        <span className="flex items-center gap-2 font-mono font-medium">
          #{order.id.slice(0, 8).toUpperCase()}
          <button
            onClick={() => { navigator.clipboard.writeText(order.id); toast.success('Order ID copied'); }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Copy order ID"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>

      {/* Progress */}
      <div className="mx-auto mt-12 max-w-3xl">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.label} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {i > 0 && <div className={`h-px flex-1 ${steps[i - 1].complete ? 'bg-success' : 'bg-border'}`} />}
                <div className={`grid h-9 w-9 place-items-center rounded-full ${s.complete ? 'bg-success text-white' : 'border-2 border-border bg-background text-muted-foreground'}`}>
                  {s.complete ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && <div className={`h-px flex-1 ${s.complete ? 'bg-success' : 'bg-border'}`} />}
              </div>
              <div className="mt-2 max-w-[80px] text-center">
                <p className="truncate text-xs font-medium">{s.label}</p>
                <p className="truncate text-[10px] text-muted-foreground">{s.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Items + summary */}
      <div className="mx-auto mt-12 grid max-w-4xl gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Items</h2>
          <ul className="space-y-4">
            {order.items.map((item, i) => (
              <li key={i} className="flex gap-3">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.image && <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="line-clamp-2 text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.size} · {item.color} · Qty {item.quantity}</span>
                  <span className="text-sm font-semibold">{formatPrice(Number(item.price) * item.quantity)}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <Truck className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">Shipping to <span className="font-medium text-foreground">{order.shipping_address.full_name}</span>, {order.shipping_address.line1}, {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatPrice(sub)}</dd></div>
            {disc > 0 && <div className="flex justify-between text-accent"><dt>Discount</dt><dd>-{formatPrice(disc)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{ship === 0 ? 'Free' : formatPrice(ship)}</dd></div>
            <div className="flex justify-between border-t pt-2 text-base"><dt className="font-semibold">Total</dt><dd className="font-display text-lg font-bold">{formatPrice(total)}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">Payment: <span className="font-medium uppercase text-foreground">{order.payment_method}</span></p>

          <div className="mt-6 flex flex-col gap-2">
            <Button asChild variant="lux" size="sm" className="rounded-full"><Link href="/account/orders">View all orders</Link></Button>
            <Button asChild variant="outline" size="sm" className="rounded-full"><Link href="/shop"><Home className="h-4 w-4" /> Continue shopping</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
