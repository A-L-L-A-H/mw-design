const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Validates a caller-supplied URL before binding it to an anchor `href`.
 * Blocks executable schemes such as `javascript:`, `data:`, and `vbscript:`
 * while preserving relative paths, fragment links, and standard web protocols.
 */
export function sanitizeUrl(url: string | undefined | null): string | undefined {
  if (typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // Reject ASCII control characters or whitespace-smuggled schemes
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    return undefined;
  }

  // Allow fragment, query, and relative paths (but reject protocol-relative `//`)
  if (trimmed.startsWith('#') || trimmed.startsWith('?') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return trimmed.startsWith('//') ? undefined : trimmed;
  }

  // If the string has no scheme separator before the first path/query/hash delimiter, treat as relative path
  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (!schemeMatch) {
    return trimmed;
  }

  const protocol = `${schemeMatch[1].toLowerCase()}:`;
  if (!SAFE_PROTOCOLS.has(protocol)) {
    return undefined;
  }

  try {
    const parsed = new URL(trimmed);
    return SAFE_PROTOCOLS.has(parsed.protocol) ? trimmed : undefined;
  } catch {
    return undefined;
  }
}
