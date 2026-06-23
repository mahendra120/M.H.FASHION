'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice, discountPercent } from '@/lib/format';
import { optimizeImageUrl, IMAGE_WIDTHS } from '@/lib/image-utils';
import { colorToHex } from '@/lib/color-swatch';
import { useCart } from '@/components/providers/cart-provider';
import { useWishlist } from '@/components/providers/wishlist-provider';
import type { Product } from '@/types';

function ProductCardInner({
  product,
  priority = false,
}: {
  product: Product;
  index?: number;
  priority?: boolean;
}) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const [hover, setHover] = useState(false);
  const liked = has(product.id);
  const discount = discountPercent(product.price, product.original_price);
  const primarySrc = optimizeImageUrl(product.images[0], IMAGE_WIDTHS.card);
  const hoverSrc = product.images[1]
    ? optimizeImageUrl(product.images[1], IMAGE_WIDTHS.card)
    : null;

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative flex flex-col"
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
          <Image
            src={primarySrc}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              'object-cover transition-opacity duration-500 ease-out',
              hover && hoverSrc ? 'opacity-0' : 'opacity-100',
            )}
            priority={priority}
            loading={priority ? undefined : 'lazy'}
          />
          {hoverSrc && (
            <Image
              src={hoverSrc}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                'object-cover transition-opacity duration-500 ease-out',
                hover ? 'opacity-100' : 'opacity-0',
              )}
              loading="lazy"
            />
          )}

          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.new_arrival && (
              <span className="rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
                New
              </span>
            )}
            {discount > 0 && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                -{discount}%
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              toggle(product);
            }}
            aria-label="Toggle wishlist"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur transition hover:scale-110"
          >
            <Heart className={cn('h-4 w-4 transition-transform', liked && 'scale-110 fill-destructive text-destructive')} />
          </button>

          <div
            className={cn(
              'absolute inset-x-3 bottom-3 translate-y-0 opacity-100 transition-all duration-300',
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

      <div className="mt-3 space-y-1.5">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-sm font-medium leading-snug tracking-tight transition-colors hover:text-accent"
        >
          {product.title}
        </Link>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <span className="text-amber-500">★</span>
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-0.5">
          {product.colors.slice(0, 4).map((c) => (
            <span
              key={c}
              className="h-3 w-3 rounded-full border border-border/80 shadow-sm"
              style={{ backgroundColor: colorToHex(c) }}
              title={c}
            />
          ))}
          {product.colors.length > 4 && (
            <span className="text-[10px] text-muted-foreground">+{product.colors.length - 4}</span>
          )}
        </div>
      </div>
    </article>
  );
}

export const ProductCard = memo(ProductCardInner);
