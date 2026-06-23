'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Heart, Menu, Search, ShoppingBag, User, X, ChevronRight, Sparkles } from 'lucide-react';
import { useHydrated } from '@/hooks/use-hydrated';
import { useAuth } from '@/components/providers/auth-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useWishlist } from '@/components/providers/wishlist-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV: { label: string; href: string }[] = [
  { label: 'Shop', href: '/shop' },
  { label: 'T-Shirts', href: '/shop?cat=t-shirts' },
  { label: 'Hoodies', href: '/shop?cat=hoodies' },
  { label: 'Caps', href: '/shop?cat=caps' },
  { label: 'Covers', href: '/shop?cat=mobile-covers' },
  { label: 'Posters', href: '/shop?cat=posters' },
];

export function SiteHeader() {
  return <SiteHeaderInner />;
}

function SiteHeaderInner() {
  const mounted = useHydrated();
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeNavCat, setActiveNavCat] = useState('');
  const pathname = usePathname();
  const { user } = useAuth();
  const { count, setOpen: setCartOpen } = useCart();
  const { items: wishlist } = useWishlist();
  const wishlistCount = wishlist.length;
  const accountHref = mounted && user ? '/account' : '/login';

  const isActive = useCallback(
    (href: string) => {
      if (!mounted || pathname !== '/shop') return false;
      const url = new URL(href, 'http://local');
      const hrefCat = url.searchParams.get('cat') ?? '';
      return hrefCat === activeNavCat;
    },
    [mounted, pathname, activeNavCat],
  );

  // Hero / scroll styling via data attributes — avoids SSR/client className mismatches.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const sync = () => {
      const onHome = pathname === '/';
      const atHero = onHome && window.scrollY <= 24;
      el.dataset.page = onHome ? 'home' : 'inner';
      el.dataset.hero = atHero ? 'true' : 'false';
    };

    sync();
    window.addEventListener('scroll', sync, { passive: true });
    return () => window.removeEventListener('scroll', sync);
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;
    if (pathname === '/shop') {
      setActiveNavCat(new URLSearchParams(window.location.search).get('cat') ?? '');
    } else {
      setActiveNavCat('');
    }
  }, [mounted, pathname]);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen, mounted]);

  return (
    <>
      <header
        ref={headerRef}
        data-page={pathname === '/' ? 'home' : 'inner'}
        data-hero="false"
        className="site-header fixed inset-x-0 top-0 z-50 transition-all duration-500"
      >
        <div className="site-header-strip hidden border-b px-6 py-2 text-[10px] uppercase tracking-[0.22em] lg:block">
          <div className="container-lux flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-accent" />
              Complimentary shipping over ₹1499
            </span>
            <div className="flex items-center gap-5">
              <span>30-day returns</span>
              <Link href="/account/orders" className="site-header-strip-link transition hover:text-accent">
                Track order
              </Link>
              <Link href="/contact" className="site-header-strip-link transition hover:text-accent">
                Help
              </Link>
            </div>
          </div>
        </div>

        <div className="container-lux grid h-[4.25rem] grid-cols-[1fr_auto_1fr] items-center gap-4 sm:h-[4.5rem]">
          <div className="flex items-center gap-1 justify-self-start">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(true)}
              className="site-header-icon lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/" className="group flex items-center">
              <span className="site-header-logo font-brand text-[1.65rem] font-bold leading-none transition-colors sm:text-[1.85rem]">
                M.H<span className="text-accent">.</span>Fashion
              </span>
            </Link>
          </div>

          <nav className="site-header-nav hidden items-center gap-1 rounded-full border p-1.5 lg:flex" aria-label="Main navigation">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  scroll={false}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'site-header-nav-link relative shrink-0 rounded-full px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                    active && 'site-header-nav-link-active',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-0.5 justify-self-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="site-header-icon hidden sm:inline-flex"
              aria-label="Search"
            >
              <Search className="h-[1.15rem] w-[1.15rem]" />
            </Button>
            <Button asChild variant="ghost" size="icon" className="site-header-icon relative" aria-label="Wishlist">
              <Link href="/wishlist">
                <Heart className="h-[1.15rem] w-[1.15rem]" />
                <CountBadge count={wishlistCount} visible={mounted} />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="site-header-icon" aria-label="Account">
              <Link href={accountHref}>
                <User className="h-[1.15rem] w-[1.15rem]" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCartOpen(true)}
              className="site-header-icon relative"
              aria-label="Cart"
            >
              <ShoppingBag className="h-[1.15rem] w-[1.15rem]" />
              <CountBadge count={count} visible={mounted} />
            </Button>
          </div>
        </div>
      </header>

      {mounted && (
        <>
          <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} isActive={isActive} />
          <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
      )}
    </>
  );
}

/** Always rendered so server/client DOM trees match; hidden until mounted + count > 0. */
function CountBadge({ count, visible }: { count: number; visible: boolean }) {
  const show = visible && count > 0;
  return (
    <span
      className={cn(
        'absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground transition-opacity',
        !show && 'pointer-events-none opacity-0',
      )}
      aria-hidden={!show}
    >
      {count > 9 ? '9+' : count || 0}
    </span>
  );
}

function MobileMenu({
  open,
  onClose,
  isActive,
}: {
  open: boolean;
  onClose: () => void;
  isActive: (href: string) => boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <span className="font-brand text-2xl font-bold">
          M.H<span className="text-accent">.</span>Fashion
        </span>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
          <X className="h-5 w-5" />
        </Button>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <div key={item.label}>
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-medium transition',
                  active ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary',
                )}
              >
                {item.label}
                <ChevronRight className="h-4 w-4 opacity-50" />
              </Link>
            </div>
          );
        })}
        <div className="mt-4 flex gap-2 border-t border-border/60 pt-4">
          <Link
            href="/about"
            onClick={onClose}
            className="flex-1 rounded-xl bg-secondary py-3 text-center text-xs font-semibold uppercase tracking-wider"
          >
            About
          </Link>
          <Link
            href="/contact"
            onClick={onClose}
            className="flex-1 rounded-xl bg-secondary py-3 text-center text-xs font-semibold uppercase tracking-wider"
          >
            Contact
          </Link>
        </div>
      </nav>
    </div>
  );
}

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close search"
      />
      <div className="fixed inset-x-0 top-0 z-[70] p-4 pt-6">
        <form
          action="/shop"
          method="get"
          className="container-lux flex max-w-2xl items-center gap-3 rounded-2xl border border-border/60 bg-card px-5 py-3.5 shadow-xl"
        >
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hoodies, caps, posters…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </form>
      </div>
    </>
  );
}
