'use client';

import { useEffect, useState } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { AdminShell, adminFetch } from '@/components/admin/admin-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Product } from '@/types';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetch('/api/products?limit=200').then((r) => r.json());
      setProducts(data.products ?? []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Unable to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase()),
  );

  const updateStock = async (product: Product, stock: number) => {
    setSavingId(product.id);
    try {
      await adminFetch(`/api/products?id=${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ stock }),
      });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock } : p)));
      toast.success('Stock updated');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSavingId(null);
    }
  };

  const lowStock = filtered.filter((p) => p.stock > 0 && p.stock <= 5);
  const outOfStock = filtered.filter((p) => p.stock <= 0);

  return (
    <AdminShell title="Inventory">
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Total SKUs" value={products.length} />
        <Stat label="Low stock (≤5)" value={lowStock.length} warn={lowStock.length > 0} />
        <Stat label="Out of stock" value={outOfStock.length} warn={outOfStock.length > 0} />
      </div>

      <div className="relative mb-6 w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or SKU…"
          className="pl-10"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Update</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b">
                  <td colSpan={5} className="px-4 py-4">
                    <Skeleton className="h-10" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No products found
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <InventoryRow
                  key={product.id}
                  product={product}
                  saving={savingId === product.id}
                  onSave={updateStock}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${warn ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  );
}

function InventoryRow({
  product,
  saving,
  onSave,
}: {
  product: Product;
  saving: boolean;
  onSave: (product: Product, stock: number) => Promise<void>;
}) {
  const [stock, setStock] = useState(String(product.stock));
  const status =
    product.stock <= 0 ? 'Out of stock' : product.stock <= 5 ? 'Low stock' : 'In stock';
  const statusClass =
    product.stock <= 0
      ? 'text-destructive'
      : product.stock <= 5
        ? 'text-amber-600'
        : 'text-emerald-600';

  return (
    <tr className="border-b">
      <td className="px-4 py-3 font-medium">{product.title}</td>
      <td className="px-4 py-3 text-muted-foreground">{product.sku}</td>
      <td className="px-4 py-3">{product.stock}</td>
      <td className={`px-4 py-3 ${statusClass}`}>
        {status === 'Low stock' && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}
        {status}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="h-9 w-24"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => onSave(product, Math.max(0, Number(stock) || 0))}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </td>
    </tr>
  );
}
