import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isUserAdmin } from '@/lib/auth/session';
import { createOrder, listOrders } from '@/lib/orders';
import type { Order, OrderItem, PaymentMethod } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    const status = url.searchParams.get('status');

    const authUser = await getUserFromRequest(req);
    const isAdmin = authUser ? isUserAdmin(authUser) : false;

    if (!authUser) {
      return NextResponse.json({ error: 'Sign in to view your orders' }, { status: 401 });
    }

    const orders = await listOrders({
      userId: authUser._id.toString(),
      userEmail: authUser.email,
      isAdmin,
      emailFilter: email,
      statusFilter: status,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('[api/orders GET]', error);
    return NextResponse.json({ error: 'Unable to load orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Order> & {
      items: OrderItem[];
      shipping_address: Order['shipping_address'];
      payment_method: PaymentMethod;
      coupon_code?: string | null;
    };

    if (!body.items?.length) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
    }
    if (!body.shipping_address) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }
    if (!body.payment_method) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }

    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Please login or sign up to continue' },
        { status: 401 },
      );
    }

    const order = await createOrder({
      items: body.items,
      shipping_address: body.shipping_address,
      payment_method: body.payment_method,
      coupon_code: body.coupon_code,
      user_id: authUser._id.toString(),
      user_email: authUser.email,
    });

    return NextResponse.json({ order, message: 'Order placed successfully' });
  } catch (error) {
    console.error('[api/orders POST]', error);
    const message = error instanceof Error ? error.message : 'Unable to place order';
    const status =
      message.includes('not configured') ? 503
      : message.includes('login') || message.includes('Authentication') ? 401
      : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
