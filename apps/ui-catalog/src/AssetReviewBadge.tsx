import { type AssetReviewStatus } from './asset-review-status';

export interface AssetReviewBadgeProps {
  status: AssetReviewStatus;
  className?: string;
  'data-testid'?: string;
}

/**
 * Reusable asset review status badge component.
 *
 * Renders a distinct text label for each status with non-color-only status cues:
 * - approved: "Approved" with checkmark icon
 * - review: "Review" with info icon
 * - blocked: "Blocked" with alert icon
 * - unverified: "Unverified" with warning icon
 *
 * Uses explicit text labels alongside icons so status is understandable
 * without relying on color alone (WCAG 2.1 AA 1.4.1).
 */
export function AssetReviewBadge({ status, className = '', 'data-testid': testId }: AssetReviewBadgeProps) {
  const statusConfig: Record<AssetReviewStatus, { label: string; icon: string; className: string }> = {
    approved: {
      label: 'Approved',
      icon: '✓',
      className: 'asset-review-badge--approved',
    },
    review: {
      label: 'Review',
      icon: '◷',
      className: 'asset-review-badge--review',
    },
    blocked: {
      label: 'Blocked',
      icon: '✕',
      className: 'asset-review-badge--blocked',
    },
    unverified: {
      label: 'Unverified',
      icon: '⚠',
      className: 'asset-review-badge--unverified',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`asset-review-badge ${config.className} ${className}`}
      data-testid={testId ?? `asset-review-badge-${status}`}
      data-status={status}
    >
      <span className="asset-review-badge__icon" aria-hidden="true">
        {config.icon}
      </span>
      <span className="asset-review-badge__text">{config.label}</span>
    </span>
  );
}