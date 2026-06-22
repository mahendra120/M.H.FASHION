'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { AuthUser } from '@/components/providers/auth-provider';
import {
  AUTH_REQUIRED_MESSAGE,
  buildLoginUrl,
  saveCheckoutReturn,
} from '@/lib/auth/checkout-intent';

export function useRequireAuthForCheckout() {
  const router = useRouter();

  return useCallback(
    (user: AuthUser | null, loading: boolean, returnPath: string): boolean => {
      if (loading) return false;
      if (user) return true;

      saveCheckoutReturn(returnPath);
      toast.error(AUTH_REQUIRED_MESSAGE);
      router.push(buildLoginUrl(returnPath));
      return false;
    },
    [router],
  );
}
