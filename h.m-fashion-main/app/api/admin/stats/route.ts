import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '../_guard';
import { updateOrderStatus } from '@/lib/orders';
import type { OrderStatus } from '@/types';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;

  // Aggregate dashboard stats
  const [{ data: orders }, { data: products }, { count: userCount }] = await Promise.all([
    supabaseAdmin.from('orders').select('total_amount, created_at, order_status').order('created_at', { ascending: false }).limit(200),
    supabaseAdmin.from('products').select('id, title, stock, rating, review_count, category'),
    // auth.users count is not directly queryable; approximate via profiles
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  const revenue = (orders ?? []).reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
  const recent = (orders ?? []).slice(0, 8);

  // best sellers by quantity across last 200 orders
  const bestSellerMap = new Map<string, { title: string; qty: number; revenue: number }>();
  for (const o of orders ?? []) {
    for (const item of (o as any).items ?? []) {
      const cur = bestSellerMap.get(item.product_id) ?? { title: item.title, qty: 0, revenue: 0 };
      cur.qty += item.quantity ?? 0;
      cur.revenue += (item.quantity ?? 0) * Number(item.price ?? 0);
      bestSellerMap.set(item.product_id, cur);
    }
  }
  const bestSellers = Array.from(bestSellerMap.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  // sales last 30 days
  const buckets = new Map<string, number>();
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }
  for (const o of orders ?? []) {
    const key = new Date(o.created_at).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + Number(o.total_amount ?? 0));
  }
  const sales = Array.from(buckets.entries()).map(([date, amount]) => ({ date, amount }));

  return NextResponse.json({
    revenue,
    orderCount: orders?.length ?? 0,
    userCount: userCount ?? 0,
    productCount: products?.length ?? 0,
    lowStock: (products ?? []).filter((p: any) => p.stock <= 20),
    bestSellers,
    recentOrders: recent,
    sales,
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;
  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

  const order = await updateOrderStatus(id, status as OrderStatus);
  if (!order) {
    return NextResponse.json({ error: 'Order not found or database unavailable' }, { status: 404 });
  }
  return NextResponse.json({ order });
}
