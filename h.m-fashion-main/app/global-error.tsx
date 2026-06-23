'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/global-error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-white px-4 font-sans text-neutral-900">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-bold">Application error</h1>
          <p className="text-sm text-neutral-600">
            A critical client module failed to load. Clear the build cache and restart the dev server.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
