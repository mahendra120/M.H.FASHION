'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      setSent(true);
      toast.success('Reset link sent');

      // In development, the API returns the reset URL for easy testing
      if (data.resetUrl) {
        try {
          const url = new URL(data.resetUrl, 'http://localhost');
          setDevResetUrl(url.pathname + url.search);
        } catch {
          setDevResetUrl(data.resetUrl);
        }
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout imageIndex={0} title="Forgot password" subtitle="We'll help you reset your password securely">
      {sent ? (
        <div className="rounded-2xl border bg-card p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
          <h3 className="mt-3 font-display text-lg font-semibold">Check your inbox</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email}</span>, a reset link is on its way.
          </p>
          {devResetUrl && (
            <div className="mt-4 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/10 p-3">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">DEV MODE — Reset Link:</p>
              <Link
                href={devResetUrl}
                className="mt-1 block break-all text-xs text-accent hover:underline"
              >
                Click here to reset your password
              </Link>
            </div>
          )}
          <Button asChild variant="lux" size="sm" className="mt-5 rounded-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" />
            </div>
          </div>
          <Button type="submit" variant="lux" size="lg" className="w-full rounded-full" disabled={loading}>
            {loading ? 'Sending…' : <>Send reset link <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it? <Link href="/login" className="font-medium text-foreground hover:text-accent">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
