import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isMongoConfigured, connectDB } from '@/lib/mongodb';
import { listOrders, updateOrderStatus } from '@/lib/orders';
import { User } from '@/models/User';
import { requireAdmin } from '../_guard';
import type { OrderStatus } from '@/types';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;

  const orders = await listOrders({ isAdmin: true });
  const recentOrders = orders.slice(0, 200);

  let products: { id: string; title: string; stock: number; rating: number; review_count: number; category: string }[] = [];
  let userCount = 0;

  try {
    const { data } = await getSupabaseAdmin()
      .from('products')
      .select('id, title, stock, rating, review_count, category');
    products = (data ?? []) as typeof products;
  } catch (err) {
    console.error('[admin/stats] products fetch failed:', err);
  }

  if (isMongoConfigured()) {
    try {
      await connectDB();
      userCount = await User.countDocuments();
    } catch (err) {
      console.error('[admin/stats] user count failed:', err);
    }
  }

  const revenue = recentOrders.reduce((s, o) => s + Number(o.total_amount ?? 0), 0);

  const bestSellerMap = new Map<string, { title: string; qty: number; revenue: number }>();
  for (const o of recentOrders) {
    for (const item of o.items ?? []) {
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

  const buckets = new Map<string, number>();
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of recentOrders) {
    const key = new Date(o.created_at).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + Number(o.total_amount ?? 0));
  }
  const sales = Array.from(buckets.entries()).map(([date, amount]) => ({ date, amount }));

  return NextResponse.json({
    revenue,
    orderCount: recentOrders.length,
    userCount,
    productCount: products.length,
    lowStock: products.filter((p) => p.stock <= 20),
    bestSellers,
    recentOrders: recentOrders.slice(0, 8).map((o) => ({
      id: o.id,
      total_amount: o.total_amount,
      created_at: o.created_at,
      order_status: o.order_status,
      payment_status: o.payment_status,
      user_email: o.user_email,
    })),
    sales,
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;
  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

  try {
    const order = await updateOrderStatus(id, status as OrderStatus);
    if (!order) {
      return NextResponse.json({ error: 'Order not found or database unavailable' }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to update order';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
