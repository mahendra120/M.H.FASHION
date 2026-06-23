'use client';

import { useEffect, useState } from 'react';

/** True only after the component has mounted in the browser (safe for client-only UI). */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
