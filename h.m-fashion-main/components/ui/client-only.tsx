'use client';

import { useState, useEffect, type ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children only after the browser has mounted.
 * Use for charts, dates, localStorage, and other client-only UI
 * to avoid hydration mismatches and SSR module factory errors.
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
