'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from 'react';
import type { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (product: Product, opts?: { size?: string; color?: string; quantity?: number }) => void;
  updateQty: (productId: string, size: string, color: string, qty: number) => void;
  remove: (productId: string, size: string, color: string) => void;
  clear: () => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

const CartContext = createContext<CartState | undefined>(undefined);
const STORAGE_KEY = 'mhf_cart_v1';

function keyFor(productId: string, size: string, color: string) {
  return `${productId}__${size}__${color}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const add: CartState['add'] = useCallback((product, opts = {}) => {
    const size = opts.size ?? product.sizes[0] ?? 'One Size';
    const color = opts.color ?? product.colors[0] ?? 'Default';
    const quantity = opts.quantity ?? 1;
    setItems((prev) => {
      const k = keyFor(product.id, size, color);
      const existing = prev.find((i) => keyFor(i.product_id, i.size, i.color) === k);
      if (existing) {
        return prev.map((i) =>
          keyFor(i.product_id, i.size, i.color) === k
            ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock || 99) }
            : i,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          slug: product.slug,
          title: product.title,
          image: product.images[0] ?? '',
          price: product.price,
          size,
          color,
          quantity: Math.min(quantity, product.stock || 99),
          stock: product.stock,
        },
      ];
    });
    setOpen(true);
  }, []);

  const updateQty = useCallback((productId: string, size: string, color: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.product_id === productId && i.size === size && i.color === color
            ? { ...i, quantity: Math.max(0, Math.min(qty, i.stock || 99)) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const remove = useCallback((productId: string, size: string, color: string) => {
    setItems((prev) => prev.filter((i) => !(i.product_id === productId && i.size === size && i.color === color)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.quantity * i.price, 0), [items]);

  const value = useMemo(
    () => ({ items, count, subtotal, add, updateQty, remove, clear, isOpen, setOpen }),
    [items, count, subtotal, add, updateQty, remove, clear, isOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
