'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Menu, Search, ShoppingBag, User, X, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useWishlist } from '@/components/providers/wishlist-provider';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/constants';
import { cn } from '@/lib/utils';

const NAV: { label: string; href: string }[] = [
  { label: 'Shop', href: '/shop' },
  { label: 'T-Shirts', href: '/shop?cat=t-shirts' },
  { label: 'Hoodies', href: '/shop?cat=hoodies' },
  { label: 'Caps', href: '/shop?cat=caps' },
  { label: 'Mobile Covers', href: '/shop?cat=mobile-covers' },
  { label: 'Posters', href: '/shop?cat=posters' },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuth();
  const { count, setOpen: setCartOpen } = useCart();
  const { items: wishlist } = useWishlist();
  const wishlistCount = wishlist.length;
  // suppress unused warning on brand
  void BRAND;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          scrolled ? 'glass-strong py-2 shadow-sm' : 'bg-transparent py-4',
        )}
      >
        {/* Top strip — hidden on small */}
        <div className="hidden items-center justify-between border-b border-border/40 px-6 text-[11px] uppercase tracking-[0.2em] text-muted-foreground lg:flex">
          <span>Complimentary shipping over ₹1499 · 30-day returns</span>
          <div className="flex items-center gap-4">
            <Link href="/account/orders" className="hover:text-foreground">Track order</Link>
            <Link href="/contact" className="hover:text-foreground">Help</Link>
          </div>
        </div>

        <div className="container-lux flex items-center justify-between gap-3 pt-1 lg:pt-2">
          {/* Left: mobile menu + search */}
          <div className="flex items-center gap-1 lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)} className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label="Search" className="lg:hidden">
              <Search className="h-5 w-5" />
            </Button>
          </div>

          {/* Center: logo */}
          <Link href="/" className="group flex items-center gap-2">
            <span className="font-nunito text-xl font-bold tracking-normal sm:text-2xl">
              M.H
              <span className="text-accent">.</span>
              Fashion
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group relative text-xs font-medium uppercase tracking-[0.15em] text-foreground/80 transition hover:text-foreground"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="hidden lg:inline-flex" aria-label="Search">
              <Search className="h-5 w-5" />
            </Button>
            <Button asChild variant="ghost" size="icon" className="relative" aria-label="Wishlist">
              <Link href="/wishlist">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && <Badge n={wishlistCount} />}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="relative" aria-label="Account">
              <Link href={user ? '/account' : '/login'}>
                <User className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCartOpen(true)} className="relative" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && <Badge n={count} />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Search */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <motion.span
      key={n}
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground"
    >
      {n > 9 ? '9+' : n}
    </motion.span>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-background lg:hidden"
        >
          <div className="flex items-center justify-between border-b px-4 py-4">
            <span className="font-nunito text-xl font-bold">M.H<span className="text-accent">.</span>Fashion</span>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex flex-col p-4">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className="flex items-center justify-between border-b border-border/60 py-4 text-lg font-medium"
              >
                {item.label}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            <Link href="/about" onClick={onClose} className="py-4 text-sm uppercase tracking-wider text-muted-foreground">About</Link>
            <Link href="/contact" onClick={onClose} className="pb-4 text-sm uppercase tracking-wider text-muted-foreground">Contact</Link>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="fixed inset-x-0 top-0 z-[70] mx-auto max-w-3xl p-4"
        >
          <form
            action="/shop"
            method="get"
            className="glass-strong flex items-center gap-3 rounded-full px-5 py-3 lux-shadow"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              autoFocus
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hoodies, caps, posters…"
              className="flex-1 bg-transparent text-base outline-none"
            />
            <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close search">
              <X className="h-4 w-4" />
            </Button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
