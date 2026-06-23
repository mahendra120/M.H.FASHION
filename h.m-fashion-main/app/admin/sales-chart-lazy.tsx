'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { ComponentProps } from 'react';

type SalesChartProps = ComponentProps<
  typeof import('./sales-chart').default
>;

const SalesChartInner = dynamic(
  () => import('./sales-chart').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[260px] w-full rounded-xl" />,
  },
);

/** Lazy-loaded Recharts chart — never evaluated on the server. */
export function SalesChartLazy(props: SalesChartProps) {
  return <SalesChartInner {...props} />;
}
