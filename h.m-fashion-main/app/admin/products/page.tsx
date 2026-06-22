'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Plus, Search, Trash2, X, Package } from 'lucide-react';
import { AdminShell, adminFetch } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/format';
import { CATEGORY_LABELS } from '@/lib/constants';
import { toast } from 'sonner';
import type { Product } from '@/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetch('/api/products?limit=200').then((r) => r.json());
      setProducts(data.products ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()),
  );

  const onDelete = async (id: string) => {
    if (!confirm('Delete this product permanently?')) return;
    try {
      await adminFetch(`/api/products?id=${id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Product deleted');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <AdminShell title="Products">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="pl-10" />
        </div>
        <Button onClick={() => setCreating(true)} variant="lux"><Plus className="h-4 w-4" /> Add product</Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b"><td colSpan={6} className="px-4 py-4"><Skeleton className="h-12" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                <Package className="mx-auto mb-2 h-8 w-8" /> No products found
              </td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b transition hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded bg-muted">
                        {p.images[0] && <Image src={p.images[0]} alt={p.title} fill sizes="40px" className="object-cover" />}
                      </div>
                      <div>
                        <p className="font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS] ?? p.category}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock <= 10 ? 'font-medium text-destructive' : ''}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.featured && <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">Featured</span>}
                      {p.new_arrival && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">New</span>}
                      {p.trending && <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-700">Trending</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(p)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted" aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => onDelete(p.id)} className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {(editing || creating) && (
          <ProductForm
            product={editing}
            onClose={() => { setEditing(null); setCreating(false); }}
            onSaved={() => { setEditing(null); setCreating(false); load(); }}
          />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}

const EMPTY_FORM = {
  title: '', description: '', category: 't-shirts', price: '', original_price: '',
  stock: '', sku: '', images: [''], sizes: ['S', 'M', 'L'], colors: ['Black'],
  featured: false, new_arrival: true, trending: false, tags: [''],
};

function ProductForm({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(product ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      images: form.images.filter(Boolean),
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      stock: Number(form.stock),
      sku: form.sku,
      sizes: form.sizes.filter(Boolean),
      colors: form.colors.filter(Boolean),
      tags: form.tags.filter(Boolean),
      featured: form.featured,
      new_arrival: form.new_arrival,
      trending: form.trending,
    };
    if (!payload.title || !payload.sku || !payload.price) {
      toast.error('Title, SKU and price are required');
      setSaving(false);
      return;
    }
    try {
      if (product) {
        await adminFetch(`/api/products?id=${product.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Product updated');
      } else {
        await adminFetch('/api/products', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Product created');
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-background/70 p-4 backdrop-blur"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="my-6 w-full max-w-2xl rounded-2xl bg-card p-6 lux-shadow-lg"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{product ? 'Edit product' : 'New product'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Label text="Title"><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></Label>
          <Label text="SKU"><Input value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="MHF-XX-001" /></Label>
          <Label text="Category">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Label>
          <Label text="Stock"><Input type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} /></Label>
          <Label text="Price (₹)"><Input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} /></Label>
          <Label text="Original price (₹)"><Input type="number" value={form.original_price} onChange={(e) => set('original_price', e.target.value)} /></Label>
        </div>

        <div className="mt-4">
          <Label text="Description"><textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm" /></Label>
        </div>

        <div className="mt-4">
          <Label text="Image URLs">
            <ListEditor values={form.images} onChange={(v) => set('images', v)} placeholder="https://images.pexels.com/…" />
          </Label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Label text="Sizes"><ListEditor values={form.sizes} onChange={(v) => set('sizes', v)} placeholder="M" /></Label>
          <Label text="Colors"><ListEditor values={form.colors} onChange={(v) => set('colors', v)} placeholder="Black" /></Label>
          <Label text="Tags"><ListEditor values={form.tags} onChange={(v) => set('tags', v)} placeholder="essential" /></Label>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          {[
            ['featured', 'Featured'],
            ['new_arrival', 'New arrival'],
            ['trending', 'Trending'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} className="h-4 w-4 accent-accent" />
              {label}
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="lux" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save product'}</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{text}</label>
      {children}
    </div>
  );
}

function ListEditor({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex gap-1">
          <Input value={v} placeholder={placeholder} onChange={(e) => onChange(values.map((x, idx) => (idx === i ? e.target.value : x)))} />
          <button onClick={() => onChange(values.filter((_, idx) => idx !== i))} className="grid h-10 w-10 shrink-0 place-items-center text-muted-foreground hover:text-destructive" aria-label="Remove">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...values, ''])}><Plus className="h-3 w-3" /> Add</Button>
    </div>
  );
}
