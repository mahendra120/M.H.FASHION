'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WHATSAPP_NUMBER, BRAND } from '@/lib/constants';

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBubble(true), 4000);
    const t2 = setTimeout(() => setBubble(false), 12000);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi ${BRAND.name} team, I have a question about an order.`,
  )}`;

  return (
    <div className="fixed bottom-5 right-4 z-[80] flex flex-col items-end gap-2 sm:right-5">
      <AnimatePresence>
        {bubble && !open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            className="glass-strong relative max-w-[calc(100vw-2.5rem)] rounded-2xl p-3 pr-8 text-sm lux-shadow sm:max-w-[220px]"
          >
            <button onClick={() => setBubble(false)} className="absolute right-2 top-2 text-muted-foreground" aria-label="Dismiss">
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="font-medium">Need a hand?</p>
            <p className="text-xs text-muted-foreground">Chat with our concierge — we usually reply in minutes.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setOpen((v) => !v)}
        size="icon"
        variant="accent"
        aria-label="WhatsApp support"
        className="h-14 w-14 rounded-full lux-shadow-lg hover:scale-105"
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.3 }}>
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </motion.span>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="glass-strong w-[calc(100vw-2.5rem)] max-w-72 rounded-3xl p-4 lux-shadow-lg"
          >
            <div className="flex items-center gap-2 border-b pb-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-success/15 text-success">●</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{BRAND.name} Concierge</p>
                <p className="text-[10px] text-muted-foreground">Typically replies instantly</p>
              </div>
            </div>
            <p className="py-3 text-xs text-muted-foreground">
              Hi there — how can we help? Tap below to start a WhatsApp chat.
            </p>
            <Button asChild variant="lux" size="sm" className="w-full rounded-full">
              <a href={href} target="_blank" rel="noopener noreferrer">
                Open WhatsApp chat
              </a>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
