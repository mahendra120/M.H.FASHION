'use client';

import { useState } from 'react';
import { MotionAside } from '@/components/safe-motion';
import { Mail, MapPin, Phone, Send, MessageCircle } from 'lucide-react';
import { PublicLayout } from '@/components/layout/public-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Reveal } from '@/components/motion';
import { BRAND, WHATSAPP_NUMBER } from '@/lib/constants';
import { toast } from 'sonner';

const TOPICS = ['Order help', 'Returns', 'Product question', 'Wholesale', 'Press'];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', topic: TOPICS[0], message: '' });
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email.includes('@') || form.message.length < 5) {
      toast.error('Please complete the form');
      return;
    }
    // Persist as a contact submission could be stored; for now confirm.
    setSent(true);
    toast.success('Message received — we will reply within 24h');
  };

  return (
    <PublicLayout title="Contact us">
      <div className="container-lux grid gap-12 pb-24 lg:grid-cols-[1fr_360px]">
        <Reveal>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">We are here</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Let's talk</h2>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Whether it's a sizing question, a return, or a press inquiry — our concierge team responds within 24 hours.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Name</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Email</label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Topic</label>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, topic: t })}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${form.topic === t ? 'border-accent bg-accent/10 text-accent' : 'hover:border-foreground'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  placeholder="How can we help?"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
              <Button type="submit" variant="lux" size="lg" className="rounded-full" disabled={sent}>
                <Send className="h-4 w-4" /> {sent ? 'Sent — thank you' : 'Send message'}
              </Button>
            </form>
          </div>
        </Reveal>

        <MotionAside
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <ContactCard icon={<Mail className="h-5 w-5" />} label="Email" value={BRAND.email} href={`mailto:${BRAND.email}`} />
          <ContactCard
            icon={<MessageCircle className="h-5 w-5" />}
            label="WhatsApp"
            value="+91 75673 07487"
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
          />
          <ContactCard icon={<MapPin className="h-5 w-5" />} label="Atelier" value={BRAND.address} />
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-5 transition hover:bg-accent/10"
          >
            <div className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">WhatsApp</p>
              <p className="text-sm font-medium">Chat with our concierge</p>
            </div>
          </a>
        </MotionAside>
      </div>
    </PublicLayout>
  );
}

function ContactCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-start gap-3 rounded-2xl border bg-card p-5 transition hover:border-accent">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-muted text-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}
