'use client';

import { motion, useScroll, useTransform, useReducedMotion, type Variants } from 'framer-motion';
import { ReactNode, useRef } from 'react';
import { useHydrated } from '@/hooks/use-hydrated';

type ShellProps = { children: ReactNode; className?: string };

/** SSR + first client paint: static div only — no Framer hooks. */
function StaticShell({ children, className }: ShellProps) {
  return <div className={className}>{children}</div>;
}

function RevealMotion({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion() === true;

  if (reduce) return <StaticShell className={className}>{children}</StaticShell>;

  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Reveal(props: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const mounted = useHydrated();

  if (!mounted) return <StaticShell className={props.className}>{props.children}</StaticShell>;
  return <RevealMotion {...props} />;
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function StaggerGroupMotion({ children, className }: ShellProps) {
  const reduce = useReducedMotion() === true;
  if (reduce) return <StaticShell className={className}>{children}</StaticShell>;

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial={false}
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({ children, className }: ShellProps) {
  const mounted = useHydrated();
  if (!mounted) return <StaticShell className={className}>{children}</StaticShell>;
  return <StaggerGroupMotion className={className}>{children}</StaggerGroupMotion>;
}

function StaggerItemMotion({ children, className }: ShellProps) {
  return (
    <motion.div className={className} variants={itemVariants} initial={false}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: ShellProps) {
  const mounted = useHydrated();
  if (!mounted) return <StaticShell className={className}>{children}</StaticShell>;
  return <StaggerItemMotion className={className}>{children}</StaggerItemMotion>;
}

function ParallaxMotion({
  children,
  className,
  intensity = 60,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() === true;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : intensity, reduce ? 0 : -intensity]);

  if (reduce) return <StaticShell className={className}>{children}</StaticShell>;

  return (
    <motion.div ref={ref} className={className} style={{ y }} initial={false}>
      {children}
    </motion.div>
  );
}

export function Parallax({
  children,
  className,
  intensity = 60,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const mounted = useHydrated();
  if (!mounted) return <StaticShell className={className}>{children}</StaticShell>;
  return (
    <ParallaxMotion className={className} intensity={intensity}>
      {children}
    </ParallaxMotion>
  );
}

function FadeInMotion({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const mounted = useHydrated();
  if (!mounted) return <StaticShell className={className}>{children}</StaticShell>;
  return (
    <FadeInMotion delay={delay} className={className}>
      {children}
    </FadeInMotion>
  );
}
