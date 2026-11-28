import { forwardRef, type ComponentProps } from 'react';

export type StatusPillVariant =
  | 'live'
  | 'reconnecting'
  | 'offline'
  | 'magpie'
  | 'ready'
  | 'absent'
  | 'clean'
  | 'dirty'
  | 'online'
  | 'offline-svc';

export type StatusPillSize = 'sm' | 'md';

export type StatusPillProps = ComponentProps<'span'> & {
  variant: StatusPillVariant;
  size?: StatusPillSize;
  pulse?: boolean;
};

export const StatusPill = forwardRef<HTMLSpanElement, StatusPillProps>(
  function StatusPill({ className, variant, size = 'sm', pulse = true, children, ...props }, ref) {
    const classes = [
      'mw-ui-status-pill',
      `mw-ui-status-pill--${variant}`,
      size !== 'md' ? `mw-ui-status-pill--${size}` : '',
      pulse ? 'mw-ui-status-pill--pulse' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span
        ref={ref}
        data-slot="status-pill"
        data-variant={variant}
        data-size={size}
        className={classes}
        {...props}
      >
        {children}
      </span>
    );
  }
);