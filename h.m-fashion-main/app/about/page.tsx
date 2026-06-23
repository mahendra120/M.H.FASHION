'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MotionSpan, MotionH1, MotionP } from '@/components/safe-motion';
import { ArrowRight, Leaf, ShieldCheck, Star, Users } from 'lucide-react';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { Reveal, StaggerGroup, StaggerItem, Parallax } from '@/components/motion';

const VALUES = [
  { icon: Leaf, title: 'Considered', body: 'Every material is sourced with intent. Less waste, more wear.' },
  { icon: Star, title: 'Obsessive', body: 'We sample and resend until the drape, weight and finish are right.' },
  { icon: ShieldCheck, title: 'Honest', body: 'Fair pricing, transparent sourcing, 30-day returns with no friction.' },
  { icon: Users, title: 'Community', body: 'Limited drops designed in conversation with our members.' },
];

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative flex h-[60vh] min-h-[420px] items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/30" />
        </div>
        <div className="container-lux relative text-white">
          <MotionSpan
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] text-accent"
          >
            Our story
          </MotionSpan>
          <MotionH1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight text-shadow-lux sm:text-6xl"
          >
            A house built for those who refuse to blend in.
          </MotionH1>
          <MotionP
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-4 max-w-xl text-white/80"
          >
            M.H.Fashion is an independent atelier crafting elevated essentials — tees, hoodies, caps, posters and covers — in limited weekly runs.
          </MotionP>
        </div>
      </section>

      {/* Manifesto */}
      <section className="container-lux py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Manifesto</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
              We design for the long way around.
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Most fashion is built for the algorithm — loud, fast, disposable. We took the opposite bet. Each piece is
              sampled multiple times, cut from obsessively sourced materials, and produced in limited numbers so nothing
              sits in a warehouse. What you wear is rare, considered, and yours alone.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              From the atelier floor to your doorstep, we handle every step. No middlemen, no inflated markups, no
              noise — just modern luxury at a price that respects you.
            </p>
          </Reveal>
          <Parallax intensity={40}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
              <Image src="https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg" alt="" fill sizes="50vw" className="object-cover" />
            </div>
          </Parallax>
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary py-20">
        <div className="container-lux">
          <Reveal>
            <p className="text-center text-xs uppercase tracking-[0.3em] text-accent">What we stand for</p>
            <h2 className="mt-3 text-center font-display text-3xl font-bold sm:text-4xl">Four principles, no compromise</h2>
          </Reveal>
          <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <StaggerItem key={v.title}>
                  <div className="rounded-2xl bg-card p-6 lux-shadow h-full">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-accent/10 text-accent">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold">{v.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{v.body}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* CTA */}
      <section className="container-lux py-20 text-center">
        <Reveal>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Step into the house</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Discover the latest drop before it sells out.
          </p>
          <Button asChild variant="lux" size="xl" className="mt-6 rounded-full">
            <Link href="/shop">Shop the collection <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
