'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from 'react';
import type { WishlistItem, Product } from '@/types';
import { getClientAuthToken } from '@/lib/auth/client';
import { useAuth } from './auth-provider';

interface WishlistState {
  items: WishlistItem[];
  has: (productId: string) => boolean;
  toggle: (product: Product) => Promise<void>;
  remove: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistState | undefined>(undefined);
const GUEST_KEY = 'mhf_wishlist_guest_v1';

function authHeaders(): HeadersInit {
  const token = getClientAuthToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const loadGuest = useCallback(() => {
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, []);

  const loadUser = useCallback(async () => {
    const res = await fetch('/api/wishlist', {
      headers: authHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      setItems([]);
      return;
    }
    const data = await res.json();
    setItems(data.items ?? []);
  }, []);

  const mergeGuestIntoAccount = useCallback(async () => {
    let guestItems: WishlistItem[] = [];
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      guestItems = raw ? JSON.parse(raw) : [];
    } catch {
      guestItems = [];
    }

    if (guestItems.length > 0) {
      for (const item of guestItems) {
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          credentials: 'include',
          body: JSON.stringify({
            action: 'add',
            product: {
              id: item.product_id,
              slug: item.slug,
              title: item.title,
              images: item.image ? [item.image] : [],
              price: item.price,
            },
          }),
        });
      }
      localStorage.removeItem(GUEST_KEY);
    }

    await loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      mergeGuestIntoAccount().finally(() => setHydrated(true));
    } else {
      loadGuest();
      setHydrated(true);
    }
  }, [user, loadGuest, mergeGuestIntoAccount]);

  useEffect(() => {
    if (!hydrated || user) return;
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated, user]);

  const has = useCallback(
    (productId: string) => items.some((i) => i.product_id === productId),
    [items],
  );

  const toggle = useCallback(
    async (product: Product) => {
      if (user) {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          credentials: 'include',
          body: JSON.stringify({ product, action: 'toggle' }),
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.items ?? []);
        }
        return;
      }

      const exists = items.some((i) => i.product_id === product.id);
      setItems((prev) =>
        exists
          ? prev.filter((i) => i.product_id !== product.id)
          : [
              ...prev,
              {
                product_id: product.id,
                slug: product.slug,
                title: product.title,
                image: product.images[0] ?? '',
                price: product.price,
                added_at: new Date().toISOString(),
              },
            ],
      );
    },
    [items, user],
  );

  const remove = useCallback(
    async (productId: string) => {
      if (user) {
        const res = await fetch(`/api/wishlist?product_id=${encodeURIComponent(productId)}`, {
          method: 'DELETE',
          headers: authHeaders(),
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.items ?? []);
        }
        return;
      }

      setItems((prev) => prev.filter((i) => i.product_id !== productId));
    },
    [user],
  );

  const value = useMemo(
    () => ({ items, has, toggle, remove }),
    [items, has, toggle, remove],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
