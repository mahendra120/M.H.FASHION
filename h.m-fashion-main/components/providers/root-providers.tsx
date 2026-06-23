'use client';

import { type ReactNode } from 'react';
import { AuthProvider } from '@/components/providers/auth-provider';
import { CartProvider } from '@/components/providers/cart-provider';
import { WishlistProvider } from '@/components/providers/wishlist-provider';
import { ClientOnly } from '@/components/ui/client-only';
import { Toaster } from '@/components/ui/sonner';
import { WhatsAppButton } from '@/components/layout/whatsapp-button';

/**
 * Single client boundary for the root layout.
 * Overlays mount after hydration to avoid webpack lazy-chunk races on first paint.
 */
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
