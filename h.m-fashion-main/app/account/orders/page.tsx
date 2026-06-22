'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import { AccountShell } from '@/components/account/account-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth, getClientAuthToken } from '@/components/providers/auth-provider';
import { formatPrice, formatDate } from '@/lib/format';
import type { Order, OrderStatus } from '@/types';
import { motion } from 'framer-motion';

const STATUS_VARIANTS: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const token = getClientAuthToken();
      const res = await fetch('/api/orders', {
        headers: token ? { authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!cancelled) {
        if (res.ok) {
          const data = await res.json();
          setOrders((data.orders ?? []) as Order[]);
        }
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <AccountShell title="My orders">
      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-display text-xl font-semibold">No orders yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Your purchase history will appear here.</p>
          <Button asChild variant="lux" size="sm" className="mt-4 rounded-full">
            <Link href="/shop">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="overflow-hidden rounded-2xl border bg-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-5 py-3">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Order</p>
                    <p className="font-mono font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Placed</p>
                    <p className="font-medium">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-medium">{formatPrice(Number(order.total_amount))}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`capitalize ${STATUS_VARIANTS[order.order_status]}`} variant="outline">
                    {order.order_status}
                  </Badge>
                  <Button asChild variant="ghost" size="sm" className="rounded-full">
                    <Link href={`/order/${order.id}`}>View <ChevronRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto p-4">
                {order.items.map((item, idx) => (
                  <Link key={idx} href={`/product/${item.slug}`} className="flex shrink-0 items-center gap-3 rounded-lg border bg-background p-2 hover:border-accent">
                    <div className="relative h-14 w-12 overflow-hidden rounded bg-muted">
                      {item.image && <Image src={item.image} alt={item.title} fill sizes="48px" className="object-cover" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.size} · {item.color} · Qty {item.quantity}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
