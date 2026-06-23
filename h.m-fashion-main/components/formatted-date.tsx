'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/format';

type DateFormat = 'short' | 'long';

/**
 * Formats ISO dates only after mount — avoids server/client locale drift.
 */
export function FormattedDate({
  iso,
  format = 'short',
  fallback = '—',
  className,
}: {
  iso?: string | null;
  format?: DateFormat;
  fallback?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(fallback);

  useEffect(() => {
    if (!iso) {
      setDisplay(fallback);
      return;
    }
    setDisplay(
      format === 'long'
        ? new Date(iso).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : formatDate(iso),
    );
  }, [iso, format, fallback]);

  return <span className={className}>{display}</span>;
}
