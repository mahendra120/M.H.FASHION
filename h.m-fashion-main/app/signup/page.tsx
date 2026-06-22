'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { buildLoginUrl } from '@/lib/auth/checkout-intent';

export default function SignupPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/account';
  const { signUp } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error, redirectTo } = await signUp(form.name.trim(), form.email.trim(), form.password, next);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Account created — welcome to M.H.Fashion');
    router.push(redirectTo ?? next);
  };

  return (
    <AuthLayout imageIndex={2} title="Create account" subtitle="Join the inner circle for early access to every drop">
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField label="Full name" icon={<User className="h-4 w-4" />} error={errors.name}>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="pl-10" />
        </AuthField>
        <AuthField label="Email" icon={<Mail className="h-4 w-4" />} error={errors.email}>
          <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="pl-10" />
        </AuthField>
        <AuthField label="Password" icon={<Lock className="h-4 w-4" />} error={errors.password}>
          <Input
            type={show ? 'text' : 'password'}
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            className="px-10"
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </AuthField>
        <AuthField label="Confirm password" icon={<Lock className="h-4 w-4" />} error={errors.confirmPassword}>
          <Input
            type={showConfirm ? 'text' : 'password'}
            required
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="••••••••"
            className="px-10"
          />
          <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}>
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </AuthField>
        <Button type="submit" variant="lux" size="lg" className="w-full rounded-full" disabled={loading}>
          {loading ? 'Creating…' : <>Create account <ArrowRight className="h-4 w-4" /></>}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          By creating an account you agree to our <Link href="/terms" className="underline">Terms</Link> & <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already a member? <Link href={buildLoginUrl(next)} className="font-medium text-foreground hover:text-accent">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

function AuthField({ label, icon, error, children }: { label: string; icon: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        {children}
      </div>
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
