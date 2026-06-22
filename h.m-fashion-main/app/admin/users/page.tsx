'use client';

import { useEffect, useState } from 'react';
import { Crown, X } from 'lucide-react';
import { AdminShell, adminFetch } from '@/components/admin/admin-shell';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { UserProfile } from '@/types';
import { formatDate } from '@/lib/format';
import { Search } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/api/admin/users');
      setUsers(data.users ?? []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (u: UserProfile) => {
    try {
      const { user } = await adminFetch(`/api/admin/users?id=${u.id}`, { method: 'PUT', body: JSON.stringify({ role: u.role === 'admin' ? 'customer' : 'admin' }) });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? user : x)));
      toast.success('Role updated');
    } catch (e: any) { toast.error(e.message); }
  };

  const filtered = users.filter((u) => u.email.toLowerCase().includes(query.toLowerCase()) || u.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <AdminShell title="Users">
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users…" className="pl-10" />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(4)].map((_, i) => <tr key={i}><td colSpan={4} className="px-4 py-4"><Skeleton className="h-12" /></td></tr>)
             : filtered.map((u) => (
              <tr key={u.id} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{(u.name || u.email || '?')[0]?.toUpperCase()}</div>
                    <div>
                      <p className="font-medium">{u.name || 'Unnamed'}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${u.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                    {u.role === 'admin' && <Crown className="h-3 w-3" />}{u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleRole(u)} className="rounded-full border px-3 py-1 text-xs hover:border-accent hover:text-accent">
                    {u.role === 'admin' ? 'Demote' : 'Promote to admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
