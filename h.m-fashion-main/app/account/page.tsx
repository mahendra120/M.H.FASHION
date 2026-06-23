'use client';

import { useEffect, useState } from 'react';
import { Mail, User, Shield, Save } from 'lucide-react';
import { AccountShell } from '@/components/account/account-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth, getClientAuthToken } from '@/components/providers/auth-provider';
import { FormattedDate } from '@/components/formatted-date';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? user?.name ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? user?.name ?? '');
  }, [profile, user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const token = getClientAuthToken();
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Could not update profile');
        return;
      }
      await refreshProfile();
      toast.success('Profile updated');
    } catch {
      toast.error('Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountShell title="My account">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold">Personal information</h3>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Full name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Email</label>
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{user?.email}</span>
              </div>
            </div>
            <Button onClick={save} variant="lux" size="sm" className="rounded-full" disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-lg font-semibold">Account security</h3>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Manage your account preferences and stay protected.</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Member since</span>
              <FormattedDate
                iso={profile?.created_at ?? user?.created_at}
                className="font-medium capitalize"
              />
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{profile?.role ?? 'customer'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Two-factor</span>
              <span className="font-medium capitalize">Not enabled</span>
            </div>
          </div>
        </div>
      </div>
    </AccountShell>
  );
}
