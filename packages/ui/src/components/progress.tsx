import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../lib/cn.js';

export type ProgressVariant = 'default' | 'magenta' | 'cyan' | 'success' | 'warning' | 'destructive';
export type ProgressSize = 'sm' | 'md' | 'lg';

export type ProgressProps = ComponentPropsWithoutRef<'div'> & {
  value?: number;
  max?: number;
  label?: ReactNode;
  showValue?: boolean;
  variant?: ProgressVariant;
  size?: ProgressSize;
  indeterminate?: boolean;
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  {
    className,
    value = 0,
    max = 100,
    label,
    showValue = false,
    variant = 'default',
    size = 'md',
    indeterminate = false,
    ...props
  },
  ref
) {
  const safeMax = max > 0 ? max : 100;
  const clampedValue = Math.min(safeMax, Math.max(0, value));
  const percent = Math.round((clampedValue / safeMax) * 100);

  return (
    <div
      ref={ref}
      data-slot="progress"
      data-variant={variant}
      data-size={size}
      data-indeterminate={indeterminate ? 'true' : undefined}
      className={cn('mw-ui-progress', className)}
      {...props}
    >
      {label || showValue ? (
        <div className="mw-ui-progress-header">
          {label ? <span className="mw-ui-progress-label">{label}</span> : <span />}
          {showValue && !indeterminate ? (
            <span className="mw-ui-progress-value">{percent}%</span>
          ) : null}
        </div>
      ) : null}
      <div
        className="mw-ui-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-label={typeof label === 'string' ? label : props['aria-label'] ?? 'Progress'}
      >
        <div
          className="mw-ui-progress-indicator"
          style={indeterminate ? undefined : { width: `${percent}%` }}
        />
      </div>
    </div>
  );
});
