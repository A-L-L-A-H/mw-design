import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../lib/cn.js';

export type AlertVariant = 'default' | 'info' | 'success' | 'warning' | 'destructive';

export type AlertProps = Omit<ComponentPropsWithoutRef<'div'>, 'title'> & {
  variant?: AlertVariant;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    className,
    variant = 'default',
    title,
    description,
    icon,
    action,
    onDismiss,
    dismissLabel = 'Dismiss alert',
    children,
    role,
    ...props
  },
  ref
) {
  const computedRole = role ?? (variant === 'destructive' || variant === 'warning' ? 'alert' : 'status');
  return (
    <div
      ref={ref}
      role={computedRole}
      data-slot="alert"
      data-variant={variant}
      className={cn('mw-ui-alert', className)}
      {...props}
    >
      {icon ? (
        <span className="mw-ui-alert-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <div className="mw-ui-alert-body">
        {title ? <div className="mw-ui-alert-title">{title}</div> : null}
        {description ? <div className="mw-ui-alert-description">{description}</div> : null}
        {children}
      </div>
      {action ? <div className="mw-ui-alert-action">{action}</div> : null}
      {onDismiss ? (
        <button
          type="button"
          className="mw-ui-alert-dismiss"
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          ×
        </button>
      ) : null}
    </div>
  );
});

export const AlertTitle = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  function AlertTitle({ className, ...props }, ref) {
    return <div ref={ref} data-slot="alert-title" className={cn('mw-ui-alert-title', className)} {...props} />;
  }
);

export const AlertDescription = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  function AlertDescription({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="alert-description"
        className={cn('mw-ui-alert-description', className)}
        {...props}
      />
    );
  }
);
