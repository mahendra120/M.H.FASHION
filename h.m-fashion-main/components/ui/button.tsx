import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-wide ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent/10 hover:text-accent hover:border-accent',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent/10 hover:text-accent',
        link: 'text-primary underline-offset-4 hover:underline',
        // Luxury variants
        lux: 'relative overflow-hidden bg-primary text-primary-foreground lux-shadow hover:lux-shadow-lg hover:-translate-y-0.5 active:translate-y-0',
        'lux-outline':
          'relative overflow-hidden border border-primary/80 bg-transparent text-primary hover:bg-primary hover:text-primary-foreground',
        'lux-light':
          'bg-white text-primary lux-shadow hover:lux-shadow-lg hover:-translate-y-0.5',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90 hover:-translate-y-0.5',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 rounded-md px-4 text-xs',
        lg: 'h-12 rounded-full px-8 text-sm',
        xl: 'h-14 rounded-full px-10 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
