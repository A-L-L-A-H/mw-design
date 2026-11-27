import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../lib/cn.js';

export type CardVariant = 'default' | 'elevated' | 'muted' | 'interactive';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export type CardProps = ComponentPropsWithoutRef<'div'> & {
  variant?: CardVariant;
  padding?: CardPadding;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant = 'default', padding = 'md', ...props },
  ref
) {
  return (
    <div
      ref={ref}
      data-slot="card"
      data-variant={variant}
      data-padding={padding}
      className={cn('mw-ui-card', className)}
      {...props}
    />
  );
});

export const CardHeader = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  function CardHeader({ className, ...props }, ref) {
    return <div ref={ref} data-slot="card-header" className={cn('mw-ui-card-header', className)} {...props} />;
  }
);

export const CardTitle = forwardRef<HTMLHeadingElement, ComponentPropsWithoutRef<'h3'>>(
  function CardTitle({ className, ...props }, ref) {
    return <h3 ref={ref} data-slot="card-title" className={cn('mw-ui-card-title', className)} {...props} />;
  }
);

export const CardDescription = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<'p'>>(
  function CardDescription({ className, ...props }, ref) {
    return (
      <p
        ref={ref}
        data-slot="card-description"
        className={cn('mw-ui-card-description', className)}
        {...props}
      />
    );
  }
);

export const CardContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  function CardContent({ className, ...props }, ref) {
    return (
      <div ref={ref} data-slot="card-content" className={cn('mw-ui-card-content', className)} {...props} />
    );
  }
);

export const CardFooter = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  function CardFooter({ className, ...props }, ref) {
    return <div ref={ref} data-slot="card-footer" className={cn('mw-ui-card-footer', className)} {...props} />;
  }
);
