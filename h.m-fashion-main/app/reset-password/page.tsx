'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No reset token found. Please request a new password reset link.');
    }
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to reset password');
        if (data.error?.includes('expired') || data.error?.includes('invalid')) {
          setError(data.error);
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <AuthLayout imageIndex={2} title="Reset password" subtitle="Set your new password">
        <div className="rounded-2xl border bg-card p-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <h3 className="mt-3 font-display text-lg font-semibold">Invalid or expired link</h3>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button asChild variant="lux" size="sm" className="mt-5 rounded-full">
            <Link href="/forgot-password">Request new link</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout imageIndex={2} title="Reset password" subtitle="Set your new password">
        <div className="rounded-2xl border bg-card p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
          <h3 className="mt-3 font-display text-lg font-semibold">Password reset!</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Button asChild variant="lux" size="sm" className="mt-5 rounded-full">
            <Link href="/login">Go to sign in <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout imageIndex={2} title="Reset password" subtitle="Enter your new password below">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            New password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="pl-10"
            />
          </div>
        </div>
        <Button type="submit" variant="lux" size="lg" className="w-full rounded-full" disabled={loading}>
          {loading ? 'Resetting…' : <>Reset password <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it? <Link href="/login" className="font-medium text-foreground hover:text-accent">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
