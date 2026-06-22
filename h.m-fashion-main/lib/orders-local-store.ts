import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Order as OrderType, OrderStatus } from '@/types';

const DATA_DIR = path.join(process.cwd(), '.data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

async function readOrders(): Promise<OrderType[]> {
  try {
    const raw = await fs.readFile(ORDERS_FILE, 'utf-8');
    return JSON.parse(raw) as OrderType[];
  } catch {
    return [];
  }
}

async function writeOrders(orders: OrderType[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

export async function localCreateOrder(order: Omit<OrderType, 'id' | 'created_at'>): Promise<OrderType> {
  const orders = await readOrders();
  const saved: OrderType = {
    ...order,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };
  orders.unshift(saved);
  await writeOrders(orders);
  return saved;
}

export async function localGetOrderById(id: string): Promise<OrderType | null> {
  const orders = await readOrders();
  return orders.find((o) => o.id === id) ?? null;
}

export async function localListOrders(opts: {
  userId?: string | null;
  userEmail?: string | null;
  isAdmin?: boolean;
  emailFilter?: string | null;
  statusFilter?: string | null;
}): Promise<OrderType[]> {
  let orders = await readOrders();

  if (opts.isAdmin) {
    if (opts.emailFilter) orders = orders.filter((o) => o.user_email === opts.emailFilter);
    if (opts.statusFilter) orders = orders.filter((o) => o.order_status === opts.statusFilter);
    return orders;
  }

  if (!opts.userId && !opts.userEmail) return [];

  orders = orders.filter(
    (o) =>
      (opts.userId && o.user_id === opts.userId) ||
      (opts.userEmail && o.user_email?.toLowerCase() === opts.userEmail.toLowerCase()),
  );
  if (opts.statusFilter) orders = orders.filter((o) => o.order_status === opts.statusFilter);
  return orders;
}

export async function localUpdateOrderStatus(id: string, status: OrderStatus): Promise<OrderType | null> {
  const orders = await readOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;
  orders[index] = { ...orders[index], order_status: status };
  await writeOrders(orders);
  return orders[index];
}
