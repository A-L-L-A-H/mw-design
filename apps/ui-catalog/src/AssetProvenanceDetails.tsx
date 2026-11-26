import { type AssetProvenanceEntry } from './asset-review-status';

export interface AssetProvenanceDetailsProps {
  provenance?: AssetProvenanceEntry;
  className?: string;
  'data-testid'?: string;
}

/**
 * Read-only asset provenance details component.
 *
 * Displays creator, source, license, terms, generated date, and distribution notes
 * without making approval assumptions. Missing fields display explicit "Unknown" state.
 *
 * Purely presentational — no network requests, no manifest parsing, no metadata mutation.
 */
export function AssetProvenanceDetails({
  provenance,
  className = '',
  'data-testid': testId,
}: AssetProvenanceDetailsProps) {
  const formatDate = (dateStr: unknown) => {
    if (!dateStr || typeof dateStr !== 'string') return 'Unknown';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return String(dateStr);
    }
  };

  const formatLicense = (license: unknown) => {
    if (!license || typeof license !== 'string' || license.trim() === '') return 'Unknown';
    return license.toUpperCase();
  };

  const formatDistribution = (distribution: unknown) => {
    if (!distribution || typeof distribution !== 'string' || distribution.trim() === '') return 'Unknown';
    return distribution;
  };

  const fields = [
    { label: 'Creator', value: provenance?.creator ?? 'Unknown' },
    { label: 'Source', value: provenance?.source ?? 'Unknown' },
    { label: 'License', value: formatLicense(provenance?.license) },
    { label: 'Terms Verified', value: provenance?.termsVerified === true ? 'Yes' : 'No' },
    { label: 'Generated', value: formatDate(provenance?.generatedOn) },
    { label: 'Distribution', value: formatDistribution(provenance?.distribution) },
  ].map((f) => ({ ...f, value: String(f.value) }));

  return (
    <div
      className={`asset-provenance-details ${className}`}
      data-testid={testId ?? 'asset-provenance-details'}
    >
      <h4 className="asset-provenance-details__heading">Asset Provenance</h4>
      <dl className="asset-provenance-details__list">
        {fields.map((field, index) => (
          <div key={index} className="asset-provenance-details__item">
            <dt className="asset-provenance-details__label">{field.label}</dt>
            <dd className="asset-provenance-details__value">
              {field.value === 'Unknown' ? (
                <span className="asset-provenance-details__unknown">{field.value}</span>
              ) : (
                field.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}