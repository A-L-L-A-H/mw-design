'use client';

import { forwardRef, type ComponentProps, type MouseEvent, type ReactNode } from 'react';
import { ChevronRightIcon } from '../icons/chevron-right.js';
import { cn } from '../lib/cn.js';
import { sanitizeUrl } from '../lib/sanitize-url.js';

export type BreadcrumbItem = {
  readonly label: ReactNode;
  readonly href?: string;
  readonly current?: boolean;
};

export type BreadcrumbsProps = Omit<ComponentProps<'nav'>, 'children'> & {
  items: readonly BreadcrumbItem[];
  renderLink?: (item: BreadcrumbItem, index: number, className: string) => ReactNode;
  onNavigate?: (item: BreadcrumbItem, event: MouseEvent<HTMLAnchorElement>) => void;
};

/** Router-agnostic breadcrumb navigation landmark with customizable link rendering. */
export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs(
  {
    items,
    renderLink,
    onNavigate,
    className,
    'aria-label': ariaLabel = 'Breadcrumb',
    ...props
  },
  ref
) {
  return (
    <nav
      ref={ref}
      aria-label={ariaLabel}
      data-slot="breadcrumbs"
      className={cn('mw-ui-breadcrumbs', className)}
      {...props}
    >
      <ol className="mw-ui-breadcrumbs-list">
        {items.map((item, index) => {
          const safeHref = sanitizeUrl(item.href);
          const isCurrent = Boolean(item.current ?? (!safeHref && index === items.length - 1));
          const key =
            typeof item.label === 'string' && safeHref
              ? `${safeHref}:${item.label}:${index}`
              : index;
          return (
            <li key={key} className="mw-ui-breadcrumbs-item">
              {index > 0 ? (
                <span className="mw-ui-breadcrumbs-separator" aria-hidden="true">
                  <ChevronRightIcon size={14} aria-hidden="true" />
                </span>
              ) : null}
              {isCurrent ? (
                <span className="mw-ui-breadcrumbs-current" aria-current="page">
                  {item.label}
                </span>
              ) : safeHref ? (
                renderLink ? (
                  renderLink({ ...item, href: safeHref }, index, 'mw-ui-breadcrumbs-link')
                ) : (
                  <a
                    href={safeHref}
                    className="mw-ui-breadcrumbs-link"
                    onClick={onNavigate ? (event) => onNavigate(item, event) : undefined}
                  >
                    {item.label}
                  </a>
                )
              ) : (
                <span className="mw-ui-breadcrumbs-text">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});

Breadcrumbs.displayName = 'Breadcrumbs';
