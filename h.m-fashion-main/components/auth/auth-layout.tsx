'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { BRAND } from '@/lib/constants';

const IMAGES = [
  'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg',
  'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg',
  'https://images.pexels.com/photos/6311662/pexels-photo-6311662.jpeg',
];

export function AuthLayout({
  children, imageIndex = 0, title, subtitle,
}: {
  children: ReactNode; imageIndex?: number; title: string; subtitle: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Visual side */}
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src={IMAGES[imageIndex % IMAGES.length]}
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />
        <div className="absolute inset-0 flex flex-col justify-between p-10 text-white">
          <Link href="/" className="font-display text-2xl font-bold">
            M.H<span className="text-accent">.</span>Fashion
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em]">
              <Sparkles className="h-3 w-3" /> {BRAND.tagline}
            </span>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-shadow-lux">
              Elevated essentials.<br />Crafted in limited runs.
            </h2>
            <p className="mt-3 max-w-md text-sm text-white/80">
              Join the inner circle for early access to drops, private sales and member-only pieces.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Link href="/" className="mb-8 block font-display text-2xl font-bold lg:hidden">
            M.H<span className="text-accent">.</span>Fashion
          </Link>
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
