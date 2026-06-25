'use client';

import dynamic from 'next/dynamic';
import { type ReactNode } from 'react';
import { AuthProvider } from '@/components/providers/auth-provider';
import { CartProvider } from '@/components/providers/cart-provider';
import { WishlistProvider } from '@/components/providers/wishlist-provider';
import { ClientOnly } from '@/components/ui/client-only';
import { Toaster } from '@/components/ui/sonner';

const WhatsAppButton = dynamic(
  () => import('@/components/layout/whatsapp-button').then((mod) => ({ default: mod.WhatsAppButton })),
  { ssr: false },
);

/** Single client boundary for the root layout. */
export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {children}
          <ClientOnly>
            <WhatsAppButton />
            <Toaster richColors position="top-center" />
          </ClientOnly>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
