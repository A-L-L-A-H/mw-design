import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../lib/cn.js';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

export type SpinnerProps = ComponentPropsWithoutRef<'span'> & {
  size?: SpinnerSize;
  label?: string;
  showLabel?: boolean;
};

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { className, size = 'md', label = 'Loading', showLabel = false, ...props },
  ref
) {
  return (
    <span
      ref={ref}
      role="status"
      aria-live="polite"
      data-slot="spinner"
      data-size={size}
      className={cn('mw-ui-spinner', className)}
      {...props}
    >
      <span className="mw-ui-spinner-ring" aria-hidden="true" />
      <span className={showLabel ? 'mw-ui-spinner-label' : 'mw-ui-visually-hidden'}>{label}</span>
    </span>
  );
});
