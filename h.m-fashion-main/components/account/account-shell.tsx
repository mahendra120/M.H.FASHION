'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LayoutDashboard, Heart, Package, LogOut, User } from 'lucide-react';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/account', label: 'Profile', icon: User },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
];

export function AccountShell({ children, title }: { children: React.ReactNode; title: string }) {
  const { user, profile, role, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=' + encodeURIComponent(pathname));
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <PublicLayout title="My account">
        <div className="container-lux py-20 text-center text-sm text-muted-foreground">Loading…</div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout title={title}>
      <div className="container-lux grid gap-8 pb-24 lg:grid-cols-[260px_1fr]">
        <aside>
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground">
                {(user.user_metadata?.name ?? user.email ?? '?')[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.user_metadata?.name ?? 'Member'}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <nav className="mt-5 flex flex-col gap-1">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                      active ? 'bg-accent/10 font-medium text-accent' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                );
              })}
              <button
                onClick={async () => { await signOut(); router.push('/'); }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </nav>
          </div>
          {role === 'admin' && (
            <Button asChild variant="lux-outline" size="sm" className="mt-4 w-full rounded-full">
              <Link href="/admin"><LayoutDashboard className="h-4 w-4" /> Admin panel</Link>
            </Button>
          )}
        </aside>
        <div>{children}</div>
      </div>
    </PublicLayout>
  );
}
