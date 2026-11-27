import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../lib/cn.js';

export type SeparatorOrientation = 'horizontal' | 'vertical';
export type SeparatorVariant = 'solid' | 'dashed' | 'ink';

export type SeparatorProps = ComponentPropsWithoutRef<'div'> & {
  orientation?: SeparatorOrientation;
  variant?: SeparatorVariant;
  decorative?: boolean;
  label?: ReactNode;
};

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(function Separator(
  {
    className,
    orientation = 'horizontal',
    variant = 'solid',
    decorative = false,
    label,
    ...props
  },
  ref
) {
  const ariaProps = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'separator' as const, 'aria-orientation': orientation };

  return (
    <div
      ref={ref}
      data-slot="separator"
      data-orientation={orientation}
      data-variant={variant}
      className={cn('mw-ui-separator', className)}
      {...ariaProps}
      {...props}
    >
      {label && orientation === 'horizontal' ? (
        <span className="mw-ui-separator-label">{label}</span>
      ) : null}
    </div>
  );
});
