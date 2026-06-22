'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { CartDrawer } from '@/components/layout/cart-drawer';

export function PublicLayout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <>
      <SiteHeader />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="min-h-screen pt-20"
      >
        {title && (
          <div className="container-lux py-8">
            <span className="text-xs uppercase tracking-[0.3em] text-accent">M.H.Fashion</span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          </div>
        )}
        {children}
      </motion.main>
      <SiteFooter />
      <CartDrawer />
    </>
  );
}
