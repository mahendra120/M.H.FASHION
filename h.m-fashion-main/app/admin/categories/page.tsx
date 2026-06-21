'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { AdminShell, adminFetch } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { Category } from '@/types';

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetch('/api/admin/categories').then((r) => r.json());
      setCats(data.categories ?? []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (id: string) => {
    if (!confirm('Delete category? Products will remain but lose this link.')) return;
    try {
      await adminFetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      setCats((prev) => prev.filter((c) => c.id !== id));
      toast.success('Category deleted');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <AdminShell title="Categories">
      <div className="flex justify-end"><Button onClick={() => setCreating(true)} variant="lux"><Plus className="h-4 w-4" /> Add category</Button></div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)
         : cats.map((c) => (
          <div key={c.id} className="overflow-hidden rounded-2xl border bg-card">
            <div className="relative h-32 bg-muted">{c.image && <Image src={c.image} alt={c.name} fill sizes="300px" className="object-cover" />}</div>
            <div className="p-4">
              <h3 className="text-sm font-medium">{c.name}</h3>
              <p className="text-xs text-muted-foreground">/{c.slug}</p>
              <div className="mt-3 flex items-center justify-end">
                <button onClick={() => setEditing(c)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => onDelete(c.id)} className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {(editing || creating) && (
          <CategoryForm category={editing} onClose={() => { setEditing(null); setCreating(false); }} onSaved={() => { setEditing(null); setCreating(false); load(); }} />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}

function CategoryForm({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(category ?? { name: '', slug: '', image: '', status: 'active', sort_order: 0 });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { name: form.name, slug: form.slug, image: form.image, status: form.status, sort_order: Number(form.sort_order) };
      if (category) await adminFetch(`/api/admin/categories?id=${category.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await adminFetch('/api/admin/categories', { method: 'POST', body: JSON.stringify(payload) });
      toast.success(category ? 'Category updated' : 'Category created');
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-background/70 p-4 backdrop-blur" onClick={onClose}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="my-6 w-full max-w-md rounded-2xl bg-card p-6 lux-shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{category ? 'Edit category' : 'New category'}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div><label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Slug (optional)</label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated" /></div>
          <div><label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Image URL</label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
          <div><label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Sort order</label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="lux" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save category'}</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
