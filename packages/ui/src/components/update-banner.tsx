'use client';

import { forwardRef, type ComponentProps } from 'react';
import { Badge } from './badge.js';
import { Button } from './button.js';
import { cn } from '../lib/cn.js';
import { sanitizeUrl } from '../lib/sanitize-url.js';
import {
  CheckCircleIcon,
  CloseIcon,
  DownloadIcon,
  ExternalLinkIcon,
  RefreshIcon,
  WarningIcon,
} from '../icons/index.js';

export type UpdateBannerStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'error';

export type UpdateBannerProps = Omit<ComponentProps<'div'>, 'children'> & {
  currentVersion: string;
  availableVersion?: string;
  status: UpdateBannerStatus;
  progressPercent?: number;
  releaseUrl?: string;
  errorMessage?: string;
  onCheck?: () => void;
  onInstall?: () => void;
  onDismiss?: () => void;
};

function clampPercent(value: number | undefined): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getStatusBadge(status: UpdateBannerStatus): {
  label: string;
  variant: 'default' | 'primary' | 'magenta' | 'cyan' | 'destructive';
} {
  switch (status) {
    case 'checking':
      return { label: 'Checking', variant: 'cyan' };
    case 'available':
      return { label: 'Update Available', variant: 'primary' };
    case 'downloading':
      return { label: 'Downloading', variant: 'cyan' };
    case 'ready':
      return { label: 'Ready to Install', variant: 'magenta' };
    case 'error':
      return { label: 'Update Error', variant: 'destructive' };
    case 'idle':
    default:
      return { label: 'Up to Date', variant: 'default' };
  }
}

export const UpdateBanner = forwardRef<HTMLDivElement, UpdateBannerProps>(function UpdateBanner(
  {
    currentVersion,
    availableVersion,
    status,
    progressPercent,
    releaseUrl,
    errorMessage,
    onCheck,
    onInstall,
    onDismiss,
    className,
    ...props
  },
  ref
) {
  const badge = getStatusBadge(status);
  const clampedProgress = clampPercent(progressPercent);
  const isLiveAlert = status === 'error';
  const safeReleaseUrl = sanitizeUrl(releaseUrl);

  return (
    <div
      ref={ref}
      data-slot="update-banner"
      data-status={status}
      role={isLiveAlert ? 'alert' : 'status'}
      aria-live={isLiveAlert ? 'assertive' : 'polite'}
      className={cn('mw-ui-update-banner', className)}
      {...props}
    >
      <div className="mw-ui-update-banner-meta">
        <Badge variant={badge.variant}>{badge.label}</Badge>

        {status === 'checking' && (
          <span className="mw-ui-update-banner-text" data-tone="muted">
            <RefreshIcon className="mw-ui-update-banner-icon mw-ui-update-banner-spin" aria-hidden="true" />
            Checking for updates (v{currentVersion})…
          </span>
        )}

        {status === 'idle' && (
          <span className="mw-ui-update-banner-text" data-tone="muted">
            <CheckCircleIcon className="mw-ui-update-banner-icon" aria-hidden="true" />
            MoonWitness Desktop v{currentVersion}
          </span>
        )}

        {status === 'available' && (
          <span className="mw-ui-update-banner-text">
            <DownloadIcon className="mw-ui-update-banner-icon" aria-hidden="true" />v{availableVersion ?? 'new'}{' '}
            available (current v{currentVersion})
          </span>
        )}

        {status === 'downloading' && (
          <span className="mw-ui-update-banner-text">
            <DownloadIcon className="mw-ui-update-banner-icon" aria-hidden="true" />
            <span>
              Downloading v{availableVersion ?? 'update'}
              {clampedProgress !== undefined ? ` (${clampedProgress}%)` : '…'}
            </span>
          </span>
        )}

        {status === 'ready' && (
          <span className="mw-ui-update-banner-text">
            <CheckCircleIcon className="mw-ui-update-banner-icon" aria-hidden="true" />v
            {availableVersion ?? 'update'} ready — restart to apply
          </span>
        )}

        {status === 'error' && (
          <span className="mw-ui-update-banner-text">
            <WarningIcon className="mw-ui-update-banner-icon" aria-hidden="true" />
            {errorMessage ?? `Unable to check for updates (v${currentVersion})`}
          </span>
        )}
      </div>

      <div className="mw-ui-update-banner-actions">
        {safeReleaseUrl && (status === 'available' || status === 'ready') && (
          <Button asChild variant="outline" size="xs">
            <a href={safeReleaseUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon className="mw-ui-update-banner-icon" aria-hidden="true" />
              Release Notes
            </a>
          </Button>
        )}

        {onCheck && (status === 'idle' || status === 'error') && (
          <Button type="button" variant="outline" size="xs" onClick={onCheck}>
            <RefreshIcon className="mw-ui-update-banner-icon" aria-hidden="true" />
            Check for Updates
          </Button>
        )}

        {onInstall && (status === 'available' || status === 'ready') && (
          <Button type="button" variant="default" size="xs" onClick={onInstall}>
            <DownloadIcon className="mw-ui-update-banner-icon" aria-hidden="true" />
            {status === 'ready' ? 'Restart & Install' : 'Download & Install'}
          </Button>
        )}

        {onDismiss && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onDismiss}
            aria-label="Dismiss update banner"
          >
            <CloseIcon className="mw-ui-update-banner-icon" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
});

UpdateBanner.displayName = 'UpdateBanner';
