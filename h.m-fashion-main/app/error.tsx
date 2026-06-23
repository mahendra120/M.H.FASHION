'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/error]', error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          A client module failed to load. This is often fixed by a hard refresh or clearing the build cache.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={() => reset()}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
