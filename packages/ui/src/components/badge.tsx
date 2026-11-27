import { forwardRef, type ComponentProps } from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'magenta'
  | 'cyan'
  | 'success'
  | 'warning'
  | 'destructive';

export type BadgeSize = 'sm' | 'md';

export type BadgeProps = ComponentProps<'span'> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant = 'default', size = 'md', ...props },
  ref
) {
  const classes = ['mw-ui-badge', className].filter(Boolean).join(' ');
  return (
    <span
      ref={ref}
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={classes}
      {...props}
    />
  );
});
