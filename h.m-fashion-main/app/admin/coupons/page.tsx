'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { AdminShell, adminFetch } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { Coupon } from '@/types';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetch('/api/admin/coupons').then((r) => r.json());
      setCoupons(data.coupons ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await adminFetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success('Coupon deleted');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      await adminFetch(`/api/admin/coupons?id=${c.id}`, { method: 'PUT', body: JSON.stringify({ active: !c.active }) });
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <AdminShell title="Coupons">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)} variant="lux"><Plus className="h-4 w-4" /> New coupon</Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Min order</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-4"><Skeleton className="h-12" /></td></tr>)
            ) : coupons.map((c) => (
              <tr key={c.id} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                <td className="px-4 py-3 capitalize">{c.discount_type}</td>
                <td className="px-4 py-3">{c.discount_type === 'percent' ? `${c.discount_value}%` : formatPrice(Number(c.discount_value))}</td>
                <td className="px-4 py-3">{formatPrice(Number(c.min_order))}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.expiry_date ? formatDate(c.expiry_date) : '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(c)} className={`rounded-full px-2 py-0.5 text-xs ${c.active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(c)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => onDelete(c.id)} className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {(editing || creating) && (
          <CouponForm coupon={editing} onClose={() => { setEditing(null); setCreating(false); }} onSaved={() => { setEditing(null); setCreating(false); load(); }} />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}

function CouponForm({ coupon, onClose, onSaved }: { coupon: Coupon | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(coupon ?? { code: '', discount_type: 'percent', discount_value: '', min_order: '0', expiry_date: '', active: true });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order: Number(form.min_order),
        expiry_date: form.expiry_date ? new Date(form.expiry_date).toISOString() : null,
        active: form.active,
      };
      if (coupon) await adminFetch(`/api/admin/coupons?id=${coupon.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await adminFetch('/api/admin/coupons', { method: 'POST', body: JSON.stringify(payload) });
      toast.success(coupon ? 'Coupon updated' : 'Coupon created');
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-background/70 p-4 backdrop-blur" onClick={onClose}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="my-6 w-full max-w-md rounded-2xl bg-card p-6 lux-shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{coupon ? 'Edit coupon' : 'New coupon'}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div><label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Code</label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" /></div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Type
              <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="percent">Percent</option>
                <option value="flat">Flat</option>
              </select>
            </label>
            <div><label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Value</label><Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} /></div>
          </div>
          <div><label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Minimum order (₹)</label><Input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} /></div>
          <div><label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Expiry date</label><Input type="date" value={form.expiry_date ? form.expiry_date.slice(0, 10) : ''} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-accent" /> Active</label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="lux" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save coupon'}</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
