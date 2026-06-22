'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Search, ChevronDown } from 'lucide-react';
import { AdminShell, adminFetch } from '@/components/admin/admin-shell';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import type { Order, OrderStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_TONE: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async (status?: OrderStatus) => {
    setLoading(true);
    try {
      const data = await adminFetch(`/api/orders${status ? `?status=${status}` : ''}`);
      setOrders(data.orders ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: OrderStatus) => {
    try {
      await adminFetch('/api/admin/stats', { method: 'POST', body: JSON.stringify({ id, status }) });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, order_status: status } : o)));
      toast.success(`Order marked ${status}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filtered = orders.filter((o) =>
    o.id.toLowerCase().includes(query.toLowerCase()) ||
    (o.user_email ?? '').toLowerCase().includes(query.toLowerCase()) ||
    o.shipping_address?.full_name?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AdminShell title="Orders">
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by ID, email, name…" className="pl-10" />
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">No orders found</p>
        ) : filtered.map((o) => (
          <div key={o.id} className="overflow-hidden rounded-2xl border bg-card">
            <button onClick={() => setOpenId(openId === o.id ? null : o.id)} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="font-mono font-medium">#{o.id.slice(0, 8).toUpperCase()}</span>
                <span className="text-muted-foreground">{o.shipping_address?.full_name ?? 'Guest'}</span>
                <span className="text-muted-foreground">{formatDate(o.created_at)}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_TONE[o.order_status]}`}>{o.order_status}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatPrice(Number(o.total_amount))}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
            <AnimatePresence>
              {openId === o.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t">
                  <div className="grid gap-4 p-4 lg:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items</p>
                      <ul className="space-y-2">
                        {o.items.map((item, i) => (
                          <li key={i} className="flex gap-2 text-sm">
                            <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded bg-muted">
                              {item.image && <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />}
                            </div>
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{item.size} · {item.color} · Qty {item.quantity} · {formatPrice(Number(item.price) * item.quantity)}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer & shipping</p>
                      <div className="space-y-1 text-sm">
                        <p>{o.shipping_address?.full_name}</p>
                        <p className="text-muted-foreground">{o.shipping_address?.email} · {o.shipping_address?.phone}</p>
                        <p className="text-muted-foreground">{o.shipping_address?.line1} {o.shipping_address?.line2}</p>
                        <p className="text-muted-foreground">{o.shipping_address?.city}, {o.shipping_address?.state} - {o.shipping_address?.pincode}</p>
                        <p className="pt-2 text-xs">Payment: <span className="font-medium uppercase">{o.payment_method}</span></p>
                      </div>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Update status</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(o.id, s)}
                            className={`rounded-full px-2.5 py-1 text-xs capitalize transition ${o.order_status === s ? `${STATUS_TONE[s]} font-medium` : 'bg-muted hover:bg-muted/70'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
