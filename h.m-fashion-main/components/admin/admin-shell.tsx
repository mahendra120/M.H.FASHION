'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Package, ListOrdered, Tags, Ticket, Image as ImageIcon, Users, ArrowLeft, LogOut, Boxes } from 'lucide-react';
import { useAuth, getClientAuthToken } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/orders', label: 'Orders', icon: ListOrdered },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, role, loading, signOut } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (role !== 'admin') {
      router.replace('/');
      return;
    }

    (async () => {
      const token = getClientAuthToken();
      const res = await fetch('/api/admin/stats', {
        headers: token ? { authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (res.status === 401 || res.status === 403) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setChecking(false);
    })();
  }, [user, role, loading, router, pathname]);

  if (loading || checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary text-sm text-muted-foreground">
        Verifying admin access…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card lg:flex">
          <div className="border-b px-5 py-4">
            <Link href="/" className="font-brand text-2xl font-bold">M.H<span className="text-accent">.</span>Fashion</Link>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Admin console</p>
          </div>
          <nav className="flex-1 space-y-0.5 p-3">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-1 border-t p-3">
            <div className="rounded-lg px-3 py-2 text-xs text-muted-foreground">
              Signed in as<br /><span className="font-medium text-foreground">{profile?.name ?? user?.email}</span>
              {role === 'admin' && <span className="mt-1 block text-[10px] uppercase tracking-wider text-accent">Administrator</span>}
            </div>
            <Button asChild variant="ghost" size="sm" className="w-full justify-start"><Link href="/"><ArrowLeft className="h-4 w-4" /> Back to store</Link></Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={async () => { await signOut(); router.push('/'); }}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-30 border-b bg-card px-4 py-3 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="shrink-0 font-brand text-2xl font-bold">M.H<span className="text-accent">.</span>Fashion</Link>
            </div>
            <nav className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap',
                      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="p-5 sm:p-8">
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
            </div>
            {children}
          </main>
        </div>
      </div>
      <Toaster richColors position="top-center" />
    </div>
  );
}

/** Fetch helper that auto-attaches the JWT for admin API calls. */
export async function adminFetch(path: string, init?: RequestInit) {
  const token = getClientAuthToken();
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) };
  if (token) headers.authorization = `Bearer ${token}`;
  if (init?.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { ...init, headers, credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}
