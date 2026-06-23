'use client';

import Link from 'next/link';
import { Instagram, Twitter, Facebook, Youtube, Mail, ArrowUpRight } from 'lucide-react';
import { CopyrightYear } from '@/components/copyright-year';
import { BRAND } from '@/lib/constants';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Shop',
    links: [
      { label: 'New Arrivals', href: '/shop?sort=new' },
      { label: 'T-Shirts', href: '/shop?cat=t-shirts' },
      { label: 'Hoodies', href: '/shop?cat=hoodies' },
      { label: 'Caps', href: '/shop?cat=caps' },
      { label: 'Mobile Covers', href: '/shop?cat=mobile-covers' },
      { label: 'Posters', href: '/shop?cat=posters' },
    ],
  },
  {
    title: 'House',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'FAQs', href: '/faq' },
      { label: 'Careers', href: '/about' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Shipping & Returns', href: '/faq' },
      { label: 'Track Order', href: '/account/orders' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms & Conditions', href: '/terms' },
    ],
  },
];

export function SiteFooter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    setSubmitted(true);
    toast.success('You are on the list. Welcome to the inner circle.');
    setEmail('');
  };

  return (
    <footer className="relative mt-24 overflow-hidden bg-primary text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 grain opacity-[0.06]" />
      {/* Newsletter */}
      <div className="container-lux border-b border-white/10 py-16">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Newsletter</p>
            <h3 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
              Early access. Private sales. No noise.
            </h3>
            <p className="text-sm text-primary-foreground/70">
              Join the inner circle — be the first to see every drop.
            </p>
          </div>
          <form onSubmit={submit} className="flex w-full items-center gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/60" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={submitted ? 'Subscribed — thank you' : 'Enter your email'}
                className="h-14 w-full rounded-full border border-white/20 bg-white/5 pl-11 pr-4 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:border-accent focus:outline-none"
              />
            </div>
            <Button type="submit" variant="accent" size="lg" className="shrink-0">
              Subscribe <ArrowUpRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Columns */}
      <div className="container-lux grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <Link href="/" className="font-brand text-3xl font-bold">
            M.H<span className="text-accent">.</span>Fashion
          </Link>
          <p className="max-w-sm text-sm text-primary-foreground/70">
            {BRAND.tagline}. Crafted in limited runs with obsessively sourced
            materials. Designed to be lived in, worn out, and kept.
          </p>
          <p className="text-sm text-primary-foreground/60">{BRAND.address}</p>
          <div className="flex items-center gap-2 pt-2">
            {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/15 transition hover:scale-110 hover:border-accent hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        {COLS.map((col) => (
          <div key={col.title} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="group inline-flex items-center gap-1 text-sm text-primary-foreground/70 transition hover:text-primary-foreground">
                    <span className="h-px w-0 bg-accent transition-all duration-300 group-hover:w-3" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-6">
        <div className="container-lux flex flex-col items-center justify-between gap-4 text-xs text-primary-foreground/60 sm:flex-row">
          <CopyrightYear />
          <div className="flex items-center gap-3">
            <span>Secured payments</span>
            <span aria-hidden>·</span>
            <span>VISA</span>
            <span aria-hidden>·</span>
            <span>Mastercard</span>
            <span aria-hidden>·</span>
            <span>UPI</span>
            <span aria-hidden>·</span>
            <span>COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
