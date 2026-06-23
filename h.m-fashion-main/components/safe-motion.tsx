'use client';

import {
  AnimatePresence,
  motion,
  type HTMLMotionProps,
  type MotionProps,
} from 'framer-motion';
import {
  createElement,
  forwardRef,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from 'react';
import { useHydrated } from '@/hooks/use-hydrated';

type StaticTag = 'div' | 'span' | 'aside' | 'li' | 'section' | 'ul' | 'article' | 'button' | 'h1' | 'p';

function stripMotionProps<T extends Record<string, unknown>>(props: T) {
  const {
    initial: _i,
    animate: _a,
    exit: _e,
    transition: _t,
    layout: _l,
    whileInView: _w,
    variants: _v,
    ...rest
  } = props as MotionProps & T;
  return rest;
}

function createSafeMotion<T extends StaticTag>(tag: T) {
  const MotionComponent = motion[tag];
  type Props = HTMLMotionProps<T> & { children?: ReactNode };

  return forwardRef<HTMLElement, Props>(function SafeMotion(props, ref) {
    const { children, ...rest } = props as Props;
    const mounted = useHydrated();

    if (!mounted) {
      return createElement(tag, { ref, ...stripMotionProps(rest) }, children);
    }

    const M = MotionComponent as ComponentType<Record<string, unknown>>;
    return (
      <M ref={ref} initial={false} {...rest}>
        {children}
      </M>
    );
  });
}

export const MotionDiv = createSafeMotion('div');
export const MotionSpan = createSafeMotion('span');
export const MotionAside = createSafeMotion('aside');
export const MotionLi = createSafeMotion('li');
export const MotionSection = createSafeMotion('section');
export const MotionUl = createSafeMotion('ul');
export const MotionArticle = createSafeMotion('article');
export const MotionButton = createSafeMotion('button');
export const MotionH1 = createSafeMotion('h1');
export const MotionP = createSafeMotion('p');

/** AnimatePresence safe for SSR — renders nothing until mounted. */
export function SafeAnimatePresence({
  children,
  ...props
}: { children: ReactNode } & ComponentProps<typeof AnimatePresence>) {
  const mounted = useHydrated();
  if (!mounted) return null;
  return <AnimatePresence {...props}>{children}</AnimatePresence>;
}
