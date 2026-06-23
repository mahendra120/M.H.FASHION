'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { AdminShell, adminFetch } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { MotionDiv, SafeAnimatePresence } from '@/components/safe-motion';
import type { Banner } from '@/types';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetch('/api/admin/banners').then((r) => r.json());
      setBanners(data.banners ?? []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (b: Banner) => {
    try {
      await adminFetch(`/api/admin/banners?id=${b.id}`, { method: 'PUT', body: JSON.stringify({ active: !b.active }) });
      setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)));
    } catch (e: any) { toast.error(e.message); }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete banner?')) return;
    try {
      await adminFetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' });
      setBanners((prev) => prev.filter((b) => b.id !== id));
      toast.success('Banner deleted');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <AdminShell title="Banners">
      <div className="flex justify-end"><Button onClick={() => setCreating(true)} variant="lux"><Plus className="h-4 w-4" /> Add banner</Button></div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)
         : banners.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-2xl border bg-card">
            <div className="relative h-32 bg-muted">
              {b.image && <Image src={b.image} alt={b.title} fill sizes="300px" className="object-cover" />}
            </div>
            <div className="p-4">
              <h3 className="line-clamp-1 text-sm font-medium">{b.title}</h3>
              <p className="text-xs text-muted-foreground">{b.link || '—'}</p>
              <div className="mt-3 flex items-center justify-between">
                <button onClick={() => toggleActive(b)} className={`rounded-full px-2 py-0.5 text-xs ${b.active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{b.active ? 'Active' : 'Inactive'}</button>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(b)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => onDelete(b.id)} className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SafeAnimatePresence>
        {(editing || creating) && (
          <BannerForm banner={editing} onClose={() => { setEditing(null); setCreating(false); }} onSaved={() => { setEditing(null); setCreating(false); load(); }} />
        )}
      </SafeAnimatePresence>
    </AdminShell>
  );
}

function BannerForm({ banner, onClose, onSaved }: { banner: Banner | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(banner ?? { title: '', image: '', link: '', active: true });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { title: form.title, image: form.image, link: form.link, active: form.active };
      if (banner) await adminFetch(`/api/admin/banners?id=${banner.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await adminFetch('/api/admin/banners', { method: 'POST', body: JSON.stringify(payload) });
      toast.success(banner ? 'Banner updated' : 'Banner created');
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-background/70 p-4 backdrop-blur" onClick={onClose}>
      <MotionDiv initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="my-6 w-full max-w-md rounded-2xl bg-card p-6 lux-shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{banner ? 'Edit banner' : 'New banner'}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div><label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Title</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Image URL</label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://images.pexels.com/…" /></div>
          <div><label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Link</label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/shop" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-accent" /> Active</label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="lux" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save banner'}</Button>
        </div>
      </MotionDiv>
    </MotionDiv>
  );
}
