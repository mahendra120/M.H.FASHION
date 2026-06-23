'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { CartDrawer } from '@/components/layout/cart-drawer';
import { cn } from '@/lib/utils';

export function PublicLayout({ children, title }: { children: ReactNode; title?: string }) {
  const isHome = usePathname() === '/';

  return (
    <>
      <SiteHeader />
      <main
        className={cn(
          'min-h-screen',
          isHome ? 'pt-0' : 'pt-[4.75rem] lg:pt-[6.75rem]',
        )}
      >
        {title && (
          <div className="container-lux py-8">
            <span className="font-brand text-lg text-accent">M.H.Fashion</span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          </div>
        )}
        {children}
      </main>
      <SiteFooter />
      <CartDrawer />
    </>
  );
}
