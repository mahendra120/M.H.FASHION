import mongoose from 'mongoose';
import { connectDB, isMongoConfigured } from '@/lib/mongodb';
import { Order, type IOrderDocument } from '@/models/Order';
import { DEMO_PRODUCTS } from '@/lib/demo-catalog';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants';
import {
  localCreateOrder,
  localGetOrderById,
  localListOrders,
  localUpdateOrderStatus,
} from '@/lib/orders-local-store';
import type { Order as OrderType, OrderItem, OrderStatus, PaymentMethod } from '@/types';

const DEMO_COUPONS: Record<string, { type: 'percent' | 'flat'; value: number; min: number }> = {
  WELCOME10: { type: 'percent', value: 10, min: 0 },
  MHF250: { type: 'flat', value: 250, min: 1999 },
  FESTIVE25: { type: 'percent', value: 25, min: 2499 },
};

interface CatalogProduct {
  id: string;
  title: string;
  price: number;
  stock: number;
}

export function serializeOrder(doc: IOrderDocument): OrderType {
  return {
    id: doc._id.toString(),
    user_id: doc.user_id,
    user_email: doc.user_email,
    items: doc.items,
    subtotal: doc.subtotal,
    discount: doc.discount,
    shipping: doc.shipping,
    total_amount: doc.total_amount,
    coupon_code: doc.coupon_code,
    payment_method: doc.payment_method,
    order_status: doc.order_status,
    shipping_address: doc.shipping_address,
    created_at: doc.createdAt.toISOString(),
  };
}

async function resolveCatalogProduct(productId: string): Promise<CatalogProduct | null> {
  const demo = DEMO_PRODUCTS.find((p) => p.id === productId);
  if (demo) {
    return { id: demo.id, title: demo.title, price: demo.price, stock: demo.stock };
  }

  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('products')
      .select('id, title, price, stock')
      .eq('id', productId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      title: data.title,
      price: Number(data.price),
      stock: Number(data.stock ?? 0),
    };
  } catch {
    return null;
  }
}

async function resolveCouponDiscount(code: string, subtotal: number): Promise<{ discount: number; code: string | null }> {
  const normalized = code.trim().toUpperCase();
  const demo = DEMO_COUPONS[normalized];
  if (demo && subtotal >= demo.min) {
    const discount =
      demo.type === 'percent'
        ? Math.round((subtotal * demo.value) / 100)
        : Math.min(demo.value, subtotal);
    return { discount, code: normalized };
  }

  if (!isSupabaseConfigured) return { discount: 0, code: null };

  try {
    const { data: coupon } = await getSupabaseAdmin()
      .from('coupons')
      .select('*')
      .eq('code', normalized)
      .eq('active', true)
      .maybeSingle();
    if (!coupon) return { discount: 0, code: null };
    const expired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
    if (expired || subtotal < Number(coupon.min_order)) return { discount: 0, code: null };
    const discount =
      coupon.discount_type === 'percent'
        ? Math.round((subtotal * Number(coupon.discount_value)) / 100)
        : Math.min(Number(coupon.discount_value), subtotal);
    return { discount, code: coupon.code };
  } catch {
    return { discount: 0, code: null };
  }
}

async function decrementStock(productId: string, qty: number) {
  if (!isSupabaseConfigured) return;
  if (productId.startsWith('demo-')) return;
  try {
    await getSupabaseAdmin().rpc('decrement_stock', { p_product_id: productId, p_qty: qty });
  } catch (error) {
    console.warn('[orders] stock decrement skipped:', productId, error);
  }
}

export interface CreateOrderInput {
  items: OrderItem[];
  shipping_address: OrderType['shipping_address'];
  payment_method: PaymentMethod;
  coupon_code?: string | null;
  user_id: string;
  user_email?: string | null;
}

export async function createOrder(input: CreateOrderInput): Promise<OrderType> {
  const { items, shipping_address, payment_method, coupon_code, user_id, user_email } = input;

  if (!user_id) {
    throw new Error('Please login or sign up to continue');
  }
  if (!items?.length) throw new Error('Your cart is empty');
  if (!shipping_address?.email?.trim()) throw new Error('Shipping email is required');
  if (!shipping_address?.full_name?.trim()) throw new Error('Full name is required');
  if (!shipping_address?.line1?.trim()) throw new Error('Address is required');
  if (!['card', 'upi', 'cod'].includes(payment_method)) throw new Error('Invalid payment method');

  let subtotal = 0;
  const lineItems: OrderItem[] = [];

  for (const item of items) {
    const product = await resolveCatalogProduct(item.product_id);
    if (!product) {
      throw new Error(`Product not found: ${item.title || item.product_id}`);
    }
    if (item.quantity > product.stock) {
      throw new Error(`Insufficient stock for ${product.title}`);
    }
    const price = Number(product.price);
    subtotal += price * item.quantity;
    lineItems.push({
      ...item,
      title: product.title,
      price,
    });
  }

  let discount = 0;
  let appliedCoupon: string | null = null;
  if (coupon_code) {
    const coupon = await resolveCouponDiscount(coupon_code, subtotal);
    discount = coupon.discount;
    appliedCoupon = coupon.code;
  }

  let shipping = subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : 99;
  if (payment_method === 'cod' && shipping > 0) {
    shipping += 20;
  }

  const total = Math.max(0, subtotal - discount) + shipping;

  const orderPayload = {
    user_id: user_id ?? null,
    user_email: user_email ?? shipping_address.email,
    items: lineItems,
    subtotal,
    discount,
    shipping,
    total_amount: total,
    coupon_code: appliedCoupon,
    payment_method,
    order_status: 'pending' as const,
    shipping_address,
  };

  for (const item of lineItems) {
    await decrementStock(item.product_id, item.quantity);
  }

  if (!isMongoConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[orders] MONGODB_URI not set — saving order to local .data/orders.json');
      return localCreateOrder(orderPayload);
    }
    throw new Error('Order database is not configured. Set MONGODB_URI in your environment.');
  }

  await connectDB();
  const order = await Order.create({
    ...orderPayload,
    payment_status: payment_method === 'cod' ? 'pending' : 'paid',
  });

  return serializeOrder(order);
}

export async function getOrderById(id: string): Promise<OrderType | null> {
  if (!isMongoConfigured()) {
    return localGetOrderById(id);
  }
  await connectDB();
  if (!mongoose.isValidObjectId(id)) {
    return localGetOrderById(id);
  }
  const order = await Order.findById(id);
  return order ? serializeOrder(order) : localGetOrderById(id);
}

export async function listOrders(opts: {
  userId?: string | null;
  userEmail?: string | null;
  isAdmin?: boolean;
  emailFilter?: string | null;
  statusFilter?: string | null;
}): Promise<OrderType[]> {
  if (!isMongoConfigured()) {
    return localListOrders(opts);
  }
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (opts.isAdmin) {
    if (opts.emailFilter) filter.user_email = opts.emailFilter;
    if (opts.statusFilter) filter.order_status = opts.statusFilter;
  } else if (opts.userId || opts.userEmail) {
    filter.$or = [
      ...(opts.userId ? [{ user_id: opts.userId }] : []),
      ...(opts.userEmail ? [{ user_email: opts.userEmail }] : []),
    ];
    if (opts.statusFilter) filter.order_status = opts.statusFilter;
  } else {
    return [];
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  return orders.map(serializeOrder);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderType | null> {
  if (!isMongoConfigured()) {
    return localUpdateOrderStatus(id, status);
  }
  await connectDB();
  const order = await Order.findByIdAndUpdate(id, { order_status: status }, { new: true });
  if (order) return serializeOrder(order);
  return localUpdateOrderStatus(id, status);
}
