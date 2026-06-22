'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, ArrowUpRight, Star, ShieldCheck, Truck, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import { PublicLayout } from '@/components/layout/public-layout';
import { Reveal, StaggerGroup, StaggerItem, Parallax } from '@/components/motion';
import { formatPrice } from '@/lib/format';
import type { Product, Category, Banner } from '@/types';

const TESTIMONIALS = [
  { name: 'Aarav Mehta', role: 'Verified buyer', body: 'The oversized tee has the best hand feel I’ve ever owned — heavyweight, structured, and the drape is unreal.', rating: 5, image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { name: 'Ishita Rao', role: 'Verified buyer', body: 'I wore the Lux Velour Hoodie on a flight to Paris and got three compliments at the gate. Premium in every stitch.', rating: 5, image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { name: 'Kabir Nair', role: 'Verified buyer', body: 'Posters arrived in museum-grade packaging. The gradient prints look better in person than online.', rating: 5, image: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=200' },
];

const STATS = [
  { value: '120K+', label: 'Happy customers' },
  { value: '4.8', label: 'Average rating' },
  { value: '48h', label: 'Metro delivery' },
  { value: '30-day', label: 'Easy returns' },
];

export function HomeClient({
  featured,
  bestSellers,
  newArrivals,
  trending,
  categories,
  banners,
}: {
  featured: Product[];
  bestSellers: Product[];
  newArrivals: Product[];
  trending: Product[];
  categories: Category[];
  banners: Banner[];
}) {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const hero = banners[0];

  return (
    <PublicLayout>
      {/* ===== HERO ===== */}
      <section ref={heroRef} className="relative h-[92vh] min-h-[640px] w-full overflow-hidden">
        {hero && (
          <motion.div style={{ y: heroY, scale: heroScale, opacity: heroOpacity }} className="absolute inset-0">
            <Image
              src={hero.image}
              alt={hero.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ width: '100%', height: '100%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />
          </motion.div>
        )}
        <div className="container-lux relative flex h-full flex-col justify-end pb-20 text-white">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/30 px-4 py-1.5 text-[11px] uppercase tracking-[0.25em] backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" /> FW Limited Edition
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-shadow-lux sm:text-7xl lg:text-8xl"
          >
            Wear<br />Confidence.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-5 max-w-md text-base text-white/80 sm:text-lg"
          >
            Elevated essentials in limited runs — built for those who refuse to blend in.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Button asChild variant="accent" size="xl" className="rounded-full">
              <Link href="/shop">Shop the collection <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="rounded-full border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white hover:text-primary">
              <Link href="/shop?cat=hoodies">Explore hoodies</Link>
            </Button>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
            <div className="h-8 w-px bg-white/40">
              <motion.div
                animate={{ y: [0, 24, 0], opacity: [1, 0, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="h-3 w-px bg-white"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== Marquee value strip ===== */}
      <section className="overflow-hidden border-y bg-primary py-3 text-primary-foreground">
        <div className="marquee-track flex w-max gap-12 whitespace-nowrap text-xs uppercase tracking-[0.3em]">
          {[...Array(2)].flatMap((_, k) => [
            <span key={`a${k}`} className="flex items-center gap-2"><Truck className="h-3.5 w-3.5" /> Free shipping over ₹1499</span>,
            <span key={`b${k}`}>·</span>,
            <span key={`c${k}`}>Limited weekly drops</span>,
            <span key={`d${k}`}>·</span>,
            <span key={`e${k}`} className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Secure payments</span>,
            <span key={`f${k}`}>·</span>,
            <span key={`g${k}`} className="flex items-center gap-2"><RefreshCw className="h-3.5 w-3.5" /> 30-day returns</span>,
            <span key={`h${k}`}>·</span>,
          ])}
        </div>
      </section>

      {/* ===== Categories ===== */}
      <section className="container-lux py-20">
        <Reveal>
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accent">Categories</p>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Shop by category</h2>
            </div>
            <Link href="/shop" className="hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:flex">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <StaggerGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
          {categories.map((cat, i) => (
            <StaggerItem key={cat.id}>
              <CategoryTile cat={cat} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* ===== Best Sellers ===== */}
      <ProductRow title="Best sellers" eyebrow="Customer favourites" products={bestSellers} viewAllHref="/shop?sort=popular" />

      {/* ===== Limited offer banner ===== */}
      <section className="container-lux py-12">
        <Parallax intensity={30}>
          <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground sm:p-14">
            <div className="absolute inset-0 grain opacity-[0.05]" />
            <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-accent">Limited time</p>
                <h3 className="mt-2 max-w-xl font-display text-3xl font-bold leading-tight sm:text-4xl">
                  FESTIVE25 — 25% off the entire new collection
                </h3>
                <p className="mt-2 text-sm text-primary-foreground/70">On orders above ₹2,499. Ends soon.</p>
              </div>
              <Button asChild variant="accent" size="xl" className="rounded-full">
                <Link href="/shop">Use code <ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </Parallax>
      </section>

      {/* ===== New Arrivals ===== */}
      <ProductRow title="New arrivals" eyebrow="Just landed" products={newArrivals} viewAllHref="/shop?new=true" />

      {/* ===== Featured showcase ===== */}
      <section className="bg-secondary py-20">
        <div className="container-lux">
          <Reveal>
            <div className="mb-10 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-accent">The Edit</p>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Featured pieces</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                Hand-picked designs our atelier is obsessed with this season.
              </p>
            </div>
          </Reveal>
          <StaggerGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
            {featured.slice(0, 4).map((p, i) => (
              <StaggerItem key={p.id}>
                <ProductCard product={p} index={i} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="container-lux py-20">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className="text-center">
                <p className="font-display text-4xl font-bold sm:text-5xl">{s.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Trending ===== */}
      <ProductRow title="Trending now" eyebrow="Hot this week" products={trending} viewAllHref="/shop?trending=true" />

      {/* ===== Testimonials ===== */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container-lux">
          <Reveal>
            <div className="mb-12 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-accent">Testimonials</p>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Loved by thousands</h2>
            </div>
          </Reveal>
          <StaggerGroup className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <StaggerItem key={t.name}>
                <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="mb-3 flex gap-0.5">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-primary-foreground/85">“{t.body}”</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white/10">
                      <Image src={t.image} alt={t.name} fill sizes="40px" className="object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-primary-foreground/60">{t.role}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ===== Social showcase ===== */}
      <section className="container-lux py-20">
        <Reveal>
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">@mh.fashion</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">As worn by the community</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">Tag us to be featured across our channels.</p>
          </div>
        </Reveal>
        <StaggerGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[...newArrivals, ...featured].slice(0, 6).map((p, i) => (
            <StaggerItem key={`${p.id}-ig-${i}`}>
              <Link href={`/product/${p.slug}`} className="group relative block aspect-square overflow-hidden rounded-xl bg-muted">
                <Image
                  src={p.images[0]}
                  alt={p.title}
                  fill
                  sizes="(max-width:640px) 50vw, 16vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="line-clamp-1 text-xs font-medium text-white">{p.title}</span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>
    </PublicLayout>
  );
}

function ProductRow({
  title,
  eyebrow,
  products,
  viewAllHref,
}: {
  title: string;
  eyebrow: string;
  products: Product[];
  viewAllHref: string;
}) {
  if (!products.length) return null;
  return (
    <section className="container-lux py-16">
      <Reveal>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{title}</h2>
          </div>
          <Link href={viewAllHref} className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>
      <StaggerGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.slice(0, 4).map((p, i) => (
          <StaggerItem key={p.id}>
            <ProductCard product={p} index={i} />
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

function CategoryTile({ cat }: { cat: Category }) {
  return (
    <Link
      href={`/shop?cat=${cat.slug}`}
      className="group relative block overflow-hidden rounded-2xl bg-muted aspect-[4/5]"
    >
      <Image
        src={cat.image}
        alt={cat.name}
        fill
        sizes="(max-width:640px) 50vw, 20vw"
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="font-display text-lg font-semibold text-white drop-shadow">{cat.name}</h3>
        <span className="mt-1 flex items-center gap-1 text-xs text-white/80 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
          Shop now <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
