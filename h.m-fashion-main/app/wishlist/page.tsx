'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2, ArrowRight } from 'lucide-react';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/components/providers/wishlist-provider';
import { formatPrice } from '@/lib/format';
import { MotionDiv, SafeAnimatePresence } from '@/components/safe-motion';

export default function WishlistPage() {
  const { items, remove } = useWishlist();

  return (
    <PublicLayout title="Wishlist">
      <div className="container-lux pb-24">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-muted">
              <Heart className="h-9 w-9 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">Your wishlist is empty</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tap the heart on any product to save it here.</p>
            </div>
            <Button asChild variant="lux" size="lg" className="rounded-full">
              <Link href="/shop">Browse collection <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <SafeAnimatePresence>
              {items.map((item) => (
                <MotionDiv
                  key={item.product_id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative"
                >
                  <Link href={`/product/${item.slug}`} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
                      {item.image && <Image src={item.image} alt={item.title} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />}
                      <button
                        onClick={(e) => { e.preventDefault(); remove(item.product_id); }}
                        className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur hover:text-destructive"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Link>
                  <div className="mt-3">
                    <Link href={`/product/${item.slug}`} className="line-clamp-1 text-sm font-medium hover:text-accent">{item.title}</Link>
                    <p className="text-sm font-semibold">{formatPrice(item.price)}</p>
                  </div>
                </MotionDiv>
              ))}
            </SafeAnimatePresence>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
