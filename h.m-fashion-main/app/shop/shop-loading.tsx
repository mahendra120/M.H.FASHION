import { Skeleton } from '@/components/ui/skeleton';
import { PublicLayout } from '@/components/layout/public-layout';

export function ShopLoading() {
  return (
    <PublicLayout>
      <section className="border-b bg-secondary/30">
        <div className="container-lux py-8 lg:py-10">
          <Skeleton className="mb-4 h-4 w-48" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        </div>
      </section>
      <div className="container-lux py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
