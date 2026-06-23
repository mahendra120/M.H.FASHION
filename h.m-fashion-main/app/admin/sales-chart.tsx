'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPrice, formatDate } from '@/lib/format';

/** Client-only Recharts chart — imported with dynamic({ ssr: false }). */
export default function SalesChart({
  sales,
}: {
  sales: { date: string; amount: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={sales}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(38 60% 50%)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="hsl(38 60% 50%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 16% 88%)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={11} stroke="#9ca3af" />
        <YAxis fontSize={11} stroke="#9ca3af" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(v: number) => [formatPrice(v), 'Sales']}
          labelFormatter={(d) => formatDate(d)}
          contentStyle={{ borderRadius: 12, border: '1px solid hsl(30 16% 88%)' }}
        />
        <Area type="monotone" dataKey="amount" stroke="hsl(38 60% 50%)" strokeWidth={2} fill="url(#grad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
