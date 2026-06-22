'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { buildSignupUrl } from '@/lib/auth/checkout-intent';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useAuth();
  const next = params.get('next') ?? '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, redirectTo } = await signIn(email, password, next);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Welcome back');
    router.push(redirectTo ?? next);
  };

  return (
    <AuthLayout imageIndex={1} title="Welcome back" subtitle="Sign in to your M.H.Fashion account">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</label>
            <Link href="/forgot-password" className="text-xs text-accent hover:underline">Forgot?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type={show ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="px-10"
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" variant="lux" size="lg" className="w-full rounded-full" disabled={loading}>
          {loading ? 'Signing in…' : <>Sign in <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to M.H.Fashion? <Link href={buildSignupUrl(next)} className="font-medium text-foreground hover:text-accent">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
