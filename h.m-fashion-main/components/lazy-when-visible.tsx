'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useHydrated } from '@/hooks/use-hydrated';

/**
 * Renders children only when the section enters (or nears) the viewport.
 * Cuts initial network for below-the-fold images and heavy subtrees.
 */
export function LazyWhenVisible({
  children,
  minHeight = 280,
  rootMargin = '250px',
}: {
  children: ReactNode;
  minHeight?: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, hydrated]);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
}
