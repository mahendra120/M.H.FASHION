'use client';

import { useState, useEffect } from 'react';
import { BRAND } from '@/lib/constants';
import { ClientOnly } from '@/components/ui/client-only';

function CopyrightYearInner() {
  const [year, setYear] = useState('');

  useEffect(() => {
    setYear(String(new Date().getFullYear()));
  }, []);

  return (
    <span suppressHydrationWarning>
      © {year} {BRAND.name}. All rights reserved.
    </span>
  );
}

/** Footer copyright — client-only year avoids SSR/client text drift. */
export function CopyrightYear() {
  return (
    <ClientOnly
      fallback={
        <span>
          © {BRAND.name}. All rights reserved.
        </span>
      }
    >
      <CopyrightYearInner />
    </ClientOnly>
  );
}
