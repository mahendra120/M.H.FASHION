'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Package, IndianRupee, Users, ShoppingCart, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { formatPrice, formatDate } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  revenue: number;
  orderCount: number;
  userCount: number;
  productCount: number;
  lowStock: { id: string; title: string; stock: number }[];
  bestSellers: { id: string; title: string; qty: number; revenue: number }[];
  recentOrders: { id: string; total_amount: number; created_at: string; order_status: string }[];
  sales: { date: string; amount: number }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await import('@/components/admin/admin-shell').then((m) => m.adminFetch('/api/admin/stats'));
        if (!cancelled) setStats(data);
      } catch (e) {
        // ignore — admin shell will redirect if unauthenticated
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const cards = stats ? [
    { label: 'Total Revenue', value: formatPrice(stats.revenue), icon: IndianRupee, tone: 'text-success' },
    { label: 'Orders', value: stats.orderCount, icon: ShoppingCart, tone: 'text-accent' },
    { label: 'Customers', value: stats.userCount, icon: Users, tone: 'text-blue-600' },
    { label: 'Products', value: stats.productCount, icon: Package, tone: 'text-foreground' },
  ] : [];

  return (
    <AdminShell title="Dashboard">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats ? cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</span>
                <Icon className={`h-4 w-4 ${c.tone}`} />
              </div>
              <p className="mt-2 font-display text-2xl font-bold">{c.value}</p>
            </div>
          );
        }) : [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Sales chart */}
        <div className="rounded-2xl border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Sales — last 30 days</h2>
            <span className="text-xs text-muted-foreground">{formatPrice(stats?.revenue ?? 0)} total</span>
          </div>
          {stats ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.sales}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(38 60% 50%)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(38 60% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 16% 88%)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={11} stroke="#9ca3af" />
                <YAxis fontSize={11} stroke="#9ca3af" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => [formatPrice(v), 'Sales']}
                  labelFormatter={(d) => formatDate(d)}
                  contentStyle={{ borderRadius: 12, border: '1px solid hsl(30 16% 88%)' }}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(38 60% 50%)" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Skeleton className="h-[260px] w-full rounded-xl" />}
        </div>

        {/* Best sellers */}
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-4 font-display text-lg font-semibold">Best sellers</h2>
          <ul className="space-y-3">
            {stats?.bestSellers.slice(0, 5).map((b, i) => (
              <li key={b.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 truncate">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-muted text-xs font-semibold">{i + 1}</span>
                  <Link href={`/product/${b.id}`} className="truncate hover:text-accent">{b.title}</Link>
                </span>
                <span className="shrink-0 font-medium">{b.qty} sold</span>
              </li>
            )) ?? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-8" />)}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs text-accent hover:underline">View all <ArrowUpRight className="h-3 w-3" /></Link>
          </div>
          <ul className="divide-y">
            {stats?.recentOrders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5 text-sm">
                <span className="font-mono">#{o.id.slice(0, 8).toUpperCase()}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{o.order_status}</span>
                <span className="text-xs text-muted-foreground">{formatDate(o.created_at)}</span>
                <span className="font-medium">{formatPrice(Number(o.total_amount))}</span>
              </li>
            )) ?? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}
          </ul>
        </div>

        {/* Low stock */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="font-display text-lg font-semibold">Low stock alert</h2>
          </div>
          {stats?.lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">All products well stocked.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats?.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <Link href={`/admin/products`} className="hover:text-accent">{p.title}</Link>
                  <span className={`font-medium ${p.stock <= 10 ? 'text-destructive' : 'text-warning'}`}>{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
