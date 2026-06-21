'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice, discountPercent } from '@/lib/format';
import { useCart } from '@/components/providers/cart-provider';
import { useWishlist } from '@/components/providers/wishlist-provider';
import type { Product } from '@/types';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const [hover, setHover] = useState(false);
  const liked = has(product.id);
  const discount = discountPercent(product.price, product.original_price);

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative flex flex-col"
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              'object-cover transition-all duration-700 ease-out',
              hover ? 'scale-105 opacity-0' : 'scale-100 opacity-100',
            )}
            priority={index < 4}
          />
          {product.images[1] && (
            <Image
              src={product.images[1]}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                'object-cover transition-all duration-700 ease-out',
                hover ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
              )}
            />
          )}

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.new_arrival && (
              <span className="rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">New</span>
            )}
            {discount > 0 && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">-{discount}%</span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              toggle(product);
            }}
            aria-label="Toggle wishlist"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur transition hover:scale-110"
          >
            <motion.span animate={{ scale: liked ? [1, 1.4, 1] : 1 }} transition={{ duration: 0.4 }}>
              <Heart className={cn('h-4 w-4', liked && 'fill-destructive text-destructive')} />
            </motion.span>
          </button>

          {/* Quick add — always visible on touch devices, hover-revealed on devices that support hover */}
          <div
            className={cn(
              'absolute inset-x-3 bottom-3 translate-y-0 opacity-100 transition-all duration-500',
              'md:translate-y-4 md:opacity-0',
              hover && 'md:translate-y-0 md:opacity-100',
            )}
          >
            <Button
              variant="lux-light"
              size="sm"
              className="w-full rounded-full"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                add(product);
              }}
            >
              <ShoppingBag className="h-4 w-4" /> Quick add
            </Button>
          </div>
        </div>
      </Link>

      <div className="mt-3 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/product/${product.slug}`} className="line-clamp-1 min-w-0 flex-1 text-sm font-medium tracking-tight hover:text-accent transition-colors">
            {product.title}
          </Link>
          <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <span className="text-amber-500">★</span>
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          {product.colors.slice(0, 4).map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full border border-border bg-foreground/70" title={c} />
          ))}
          {product.colors.length > 4 && (
            <span className="text-[10px] text-muted-foreground">+{product.colors.length - 4}</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
