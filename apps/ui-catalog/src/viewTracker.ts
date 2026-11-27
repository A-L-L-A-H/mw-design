export const VIEW_TRACKER_STORAGE_KEY = 'mw-ui-catalog:section-views:v1';

export type SectionViewCounts = Record<string, number>;

export interface MostViewedSectionEntry<T extends { id: string }> {
  section: T;
  count: number;
}

function getDefaultStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readSectionViews(storage: Storage | null = getDefaultStorage()): SectionViewCounts {
  if (!storage) return {};
  try {
    const raw = storage.getItem(VIEW_TRACKER_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const sanitized: SectionViewCounts = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof key === 'string' && key.length > 0 && typeof value === 'number') {
        const count = Math.floor(value);
        if (Number.isFinite(count) && count > 0) {
          sanitized[key] = count;
        }
      }
    }
    return sanitized;
  } catch {
    return {};
  }
}

function persistSectionViews(
  views: SectionViewCounts,
  storage: Storage | null = getDefaultStorage()
): void {
  if (!storage) return;
  try {
    storage.setItem(VIEW_TRACKER_STORAGE_KEY, JSON.stringify(views));
  } catch {
    // Ignore storage quota or private-mode errors gracefully.
  }
}

export function recordSectionView(
  sectionId: string,
  storage: Storage | null = getDefaultStorage()
): SectionViewCounts {
  const trimmedId = sectionId.trim();
  const current = readSectionViews(storage);
  if (!trimmedId) return current;
  const next: SectionViewCounts = {
    ...current,
    [trimmedId]: (current[trimmedId] ?? 0) + 1,
  };
  persistSectionViews(next, storage);
  return next;
}

export function clearSectionViews(
  storage: Storage | null = getDefaultStorage()
): SectionViewCounts {
  if (storage) {
    try {
      storage.removeItem(VIEW_TRACKER_STORAGE_KEY);
    } catch {
      // Ignore storage access errors gracefully.
    }
  }
  return {};
}

export function getMostViewedSections<T extends { id: string }>(
  views: SectionViewCounts,
  sections: readonly T[],
  limit = 4
): MostViewedSectionEntry<T>[] {
  if (limit <= 0) return [];
  return sections
    .map((section, index) => ({
      section,
      count: views[section.id] ?? 0,
      index,
    }))
    .filter((entry) => Number.isFinite(entry.count) && entry.count > 0)
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.index - right.index;
    })
    .slice(0, limit)
    .map(({ section, count }) => ({ section, count }));
}
