import mongoose from 'mongoose';
import { connectDB, isMongoConfigured } from '@/lib/mongodb';
import { allowDevFallbacks } from '@/lib/env';
import { Order, type IOrderDocument } from '@/models/Order';
import { DEMO_PRODUCTS } from '@/lib/demo-catalog';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants';
import { validateOrderItems } from '@/lib/order-validation';
import { validateAndApplyCoupon, recordCouponRedemption, CouponError } from '@/lib/coupons';
import { decrementStockAtomic, restoreStock, InsufficientStockError } from '@/lib/stock';
import { assertFulfillmentAllowed } from '@/lib/order-fulfillment';
import { auditLog } from '@/lib/audit-log';
import {
  sendOrderConfirmationEmail,
  sendAdminOrderNotification,
} from '@/lib/email/send-transactional';
import {
  localCreateOrder,
  localGetOrderById,
  localListOrders,
  localUpdateOrderStatus,
} from '@/lib/orders-local-store';
import type { Order as OrderType, OrderItem, OrderStatus, PaymentMethod } from '@/types';

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
    payment_status: doc.payment_status,
    order_status: doc.order_status,
    shipping_address: doc.shipping_address,
    created_at: doc.createdAt.toISOString(),
  };
}

async function resolveCatalogProduct(productId: string): Promise<CatalogProduct | null> {
  if (allowDevFallbacks()) {
    const demo = DEMO_PRODUCTS.find((p) => p.id === productId);
    if (demo) {
      return { id: demo.id, title: demo.title, price: demo.price, stock: demo.stock };
    }
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

export interface CreateOrderInput {
  items: OrderItem[];
  shipping_address: OrderType['shipping_address'];
  payment_method: PaymentMethod;
  coupon_code?: string | null;
  user_id: string;
  user_email?: string | null;
  idempotency_key?: string | null;
}

export async function createOrder(input: CreateOrderInput): Promise<OrderType> {
  const {
    shipping_address,
    payment_method,
    coupon_code,
    user_id,
    user_email,
    idempotency_key,
  } = input;

  if (!user_id) throw new Error('Please login or sign up to continue');
  if (!shipping_address?.email?.trim()) throw new Error('Shipping email is required');
  if (!shipping_address?.full_name?.trim()) throw new Error('Full name is required');
  if (!shipping_address?.line1?.trim()) throw new Error('Address is required');
  if (!['card', 'upi', 'cod'].includes(payment_method)) throw new Error('Invalid payment method');

  const items = validateOrderItems(input.items);

  if (isMongoConfigured() && idempotency_key?.trim()) {
    await connectDB();
    const existing = await Order.findOne({ user_id, idempotency_key: idempotency_key.trim() });
    if (existing) return serializeOrder(existing);
  }

  let subtotal = 0;
  const lineItems: OrderItem[] = [];

  for (const item of items) {
    const product = await resolveCatalogProduct(item.product_id);
    if (!product) {
      throw new Error(`Product not found: ${item.title || item.product_id}`);
    }
    if (item.quantity > product.stock) {
      throw new InsufficientStockError(item.product_id, product.title);
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
  if (coupon_code?.trim()) {
    try {
      const coupon = await validateAndApplyCoupon(coupon_code, subtotal, user_id);
      discount = coupon.discount;
      appliedCoupon = coupon.code;
    } catch (err) {
      const message = err instanceof CouponError ? err.message : 'Invalid coupon code';
      throw new Error(message);
    }
  }

  let shipping = subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : 99;
  if (payment_method === 'cod' && shipping > 0) {
    shipping += 20;
  }

  const total = Math.max(0, subtotal - discount) + shipping;

  const orderPayload = {
    user_id,
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
    idempotency_key: idempotency_key?.trim() || null,
  };

  const decremented: { product_id: string; quantity: number }[] = [];
  try {
    for (const item of lineItems) {
      await decrementStockAtomic(item.product_id, item.quantity, item.title);
      decremented.push({ product_id: item.product_id, quantity: item.quantity });
    }
  } catch (err) {
    for (const d of decremented) {
      await restoreStock(d.product_id, d.quantity);
    }
    throw err;
  }

  let order: OrderType;

  if (!isMongoConfigured()) {
    if (allowDevFallbacks()) {
      console.warn('[orders] MONGODB_URI not set — saving order to local .data/orders.json');
      order = await localCreateOrder({
        ...orderPayload,
        payment_status: payment_method === 'cod' ? 'pending' : 'paid',
      });
    } else {
      for (const d of decremented) {
        await restoreStock(d.product_id, d.quantity);
      }
      throw new Error('Order database is not configured. Set MONGODB_URI in your environment.');
    }
  } else {
    await connectDB();
    const doc = await Order.create({
      ...orderPayload,
      payment_status: payment_method === 'cod' ? 'pending' : 'paid',
    });
    order = serializeOrder(doc);
  }

  if (appliedCoupon) {
    try {
      await recordCouponRedemption(appliedCoupon, user_id, order.id);
    } catch (err) {
      console.error('[orders] coupon redemption record failed:', err);
    }
  }

  const customerEmail = order.user_email ?? shipping_address.email;
  try {
    await sendOrderConfirmationEmail({
      to: customerEmail,
      orderId: order.id,
      total: order.total_amount,
      items: order.items.map((i) => ({ title: i.title, quantity: i.quantity, price: i.price })),
    });
  } catch (err) {
    console.error('[orders] confirmation email failed:', err);
  }

  try {
    await sendAdminOrderNotification({
      orderId: order.id,
      customerEmail,
      total: order.total_amount,
    });
  } catch (err) {
    console.error('[orders] admin notification failed:', err);
  }

  auditLog('order.created', {
    orderId: order.id,
    userId: user_id,
    total: order.total_amount,
    itemCount: lineItems.length,
  });

  return order;
}

export async function getOrderById(id: string): Promise<OrderType | null> {
  if (!isMongoConfigured()) {
    if (allowDevFallbacks()) return localGetOrderById(id);
    return null;
  }
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  const order = await Order.findById(id);
  return order ? serializeOrder(order) : null;
}

export async function listOrders(opts: {
  userId?: string | null;
  userEmail?: string | null;
  isAdmin?: boolean;
  emailFilter?: string | null;
  statusFilter?: string | null;
}): Promise<OrderType[]> {
  if (!isMongoConfigured()) {
    if (allowDevFallbacks()) return localListOrders(opts);
    return [];
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
    if (allowDevFallbacks()) return localUpdateOrderStatus(id, status);
    return null;
  }

  await connectDB();
  const existing = await Order.findById(id);
  if (!existing) return null;

  assertFulfillmentAllowed(
    {
      payment_method: existing.payment_method,
      payment_status: existing.payment_status,
      order_status: existing.order_status,
    },
    status,
  );

  const previous = existing.order_status;
  const order = await Order.findByIdAndUpdate(id, { order_status: status }, { new: true });
  if (!order) return null;

  auditLog('order.status_updated', {
    orderId: id,
    from: previous,
    to: status,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
  });

  return serializeOrder(order);
}
