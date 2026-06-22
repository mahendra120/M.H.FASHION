'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { PublicLayout } from '@/components/layout/public-layout';
import { cn } from '@/lib/utils';

const FAQS: { q: string; a: string; cat: 'Orders' | 'Shipping' | 'Returns' | 'Products' }[] = [
  {
    cat: 'Orders',
    q: 'How long until my order ships?',
    a: 'Orders are processed within 24 hours on weekdays. Metro deliveries arrive in 48-72 hours; the rest of India in 4-6 days. You will receive tracking the moment it leaves our facility.',
  },
  {
    cat: 'Shipping',
    q: 'Do you offer free shipping?',
    a: 'Yes — free standard shipping applies to all orders above ₹1,499. Orders below that threshold carry a small ₹99 fee. Express options are available at checkout.',
  },
  {
    cat: 'Shipping',
    q: 'Do you ship internationally?',
    a: 'Currently we ship across India. International shipping is coming soon — subscribe to the newsletter to be the first to know.',
  },
  {
    cat: 'Returns',
    q: 'What is your return policy?',
    a: 'We accept returns within 30 days of delivery for unworn, unwashed items with tags intact. Initiate a return from your account and we email you a prepaid label.',
  },
  {
    cat: 'Returns',
    q: 'Can I exchange for a different size?',
    a: 'Absolutely. Place a return for the original size and place a fresh order for the new one — this is the fastest way to lock in the piece you want, since stock is limited.',
  },
  {
    cat: 'Products',
    q: 'How do I pick the right size?',
    a: 'Every product page lists model height and the size worn. If you are between sizes, size down for a fitted look or up for an oversized silhouette.',
  },
  {
    cat: 'Products',
    q: 'Are your products unisex?',
    a: 'Most pieces are designed unisex. Specific fit notes appear on each product page under "Details".',
  },
  {
    cat: 'Orders',
    q: 'Can I modify or cancel my order?',
    a: 'Within 2 hours of placing it, yes — message our concierge via WhatsApp or email and we will help immediately. After that the order enters processing and cannot be changed.',
  },
];

const CATS = ['All', 'Orders', 'Shipping', 'Returns', 'Products'] as const;

export default function FAQPage() {
  const [cat, setCat] = useState<(typeof CATS)[number]>('All');
  const [open, setOpen] = useState<number | null>(0);

  const filtered = cat === 'All' ? FAQS : FAQS.filter((f) => f.cat === cat);

  return (
    <PublicLayout title="Frequently asked questions">
      <div className="container-lux grid gap-10 pb-24 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]">Categories</h3>
          <nav className="flex flex-col gap-1">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  'rounded-lg px-3 py-2 text-left text-sm transition',
                  cat === c ? 'bg-accent/10 font-medium text-accent' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {c}
              </button>
            ))}
          </nav>
        </aside>

        <div>
          {/* Mobile cat selector */}
          <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition',
                  cat === c ? 'border-accent bg-accent/10 text-accent' : 'hover:border-foreground',
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map((item, i) => {
              const isOpen = open === i;
              return (
                <motion.div key={item.q} layout className="overflow-hidden rounded-2xl border bg-card">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="font-medium">{item.q}</span>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
