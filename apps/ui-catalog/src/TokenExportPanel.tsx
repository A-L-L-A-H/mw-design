import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@moonwitness/ui/components/button';
import {
  buildTokenExportFilename,
  collectActiveDesignTokens,
  downloadTokenFile,
  formatTokensAsCss,
  formatTokensAsJson,
  formatTokensAsTailwindTheme,
  type ActiveDesignTokenSnapshot,
  type TokenCategory,
  type TokenExportFormat,
} from './tokenExport.js';

const ALL_CATEGORIES: ReadonlyArray<{ id: TokenCategory; label: string }> = [
  { id: 'colors', label: 'Colors' },
  { id: 'spacing', label: 'Spacing & layout' },
  { id: 'typography', label: 'Typography' },
];

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }
  if (typeof document === 'undefined') return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    document.body.removeChild(textarea);
  }
  return ok;
}

export function TokenExportPanel({
  themeMode,
  skin,
  density,
}: {
  themeMode: string;
  skin: string;
  density: string;
}) {
  const [format, setFormat] = useState<TokenExportFormat>('css');
  const [selectedCategories, setSelectedCategories] = useState<TokenCategory[]>([
    'colors',
    'spacing',
    'typography',
  ]);
  const [snapshot, setSnapshot] = useState<ActiveDesignTokenSnapshot>(() =>
    collectActiveDesignTokens()
  );
  const [copied, setCopied] = useState(false);
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const downloadTimerRef = useRef<number | null>(null);

  const refreshSnapshot = useCallback(() => {
    setSnapshot(collectActiveDesignTokens());
  }, []);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => refreshSnapshot());
    return () => window.cancelAnimationFrame(raf);
  }, [themeMode, skin, density, refreshSnapshot]);

  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(() => refreshSnapshot());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-skin', 'data-density', 'class'],
    });
    return () => observer.disconnect();
  }, [refreshSnapshot]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      if (downloadTimerRef.current !== null) window.clearTimeout(downloadTimerRef.current);
    };
  }, []);

  function toggleCategory(category: TokenCategory) {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.length > 1 ? current.filter((item) => item !== category) : current;
      }
      return [...current, category];
    });
  }

  const exportedOutput = useMemo(
    () =>
      format === 'css'
        ? formatTokensAsCss(snapshot, selectedCategories)
        : format === 'tailwind'
          ? formatTokensAsTailwindTheme(snapshot, selectedCategories)
          : formatTokensAsJson(snapshot, selectedCategories),
    [format, snapshot, selectedCategories]
  );

  const filename = useMemo(
    () => buildTokenExportFilename(snapshot, format),
    [snapshot, format]
  );

  function handleDownload(targetFormat: TokenExportFormat) {
    const latest = collectActiveDesignTokens();
    setSnapshot(latest);
    const content =
      targetFormat === 'css'
        ? formatTokensAsCss(latest, selectedCategories)
        : targetFormat === 'tailwind'
          ? formatTokensAsTailwindTheme(latest, selectedCategories)
          : formatTokensAsJson(latest, selectedCategories);
    const targetName = buildTokenExportFilename(latest, targetFormat);
    const mimeType =
      targetFormat === 'json' ? 'application/json;charset=utf-8' : 'text/css;charset=utf-8';
    downloadTokenFile(content, targetName, mimeType);
    setDownloadedFile(targetName);
    if (downloadTimerRef.current !== null) {
      window.clearTimeout(downloadTimerRef.current);
    }
    downloadTimerRef.current = window.setTimeout(() => {
      setDownloadedFile(null);
      downloadTimerRef.current = null;
    }, 3000);
  }

  async function handleCopy() {
    const ok = await copyText(exportedOutput);
    if (!ok) return;
    setCopied(true);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copyTimerRef.current = null;
    }, 2000);
  }

  return (
    <div className="catalog-token-export" data-testid="token-export-panel">
      <div className="catalog-token-export-toolbar">
        <div
          className="catalog-token-export-formats"
          role="group"
          aria-label="Export format"
        >
          <button
            type="button"
            className="catalog-playground-option"
            data-active={format === 'css' ? 'true' : 'false'}
            aria-pressed={format === 'css'}
            onClick={() => setFormat('css')}
          >
            CSS Variables
          </button>
          <button
            type="button"
            className="catalog-playground-option"
            data-active={format === 'json' ? 'true' : 'false'}
            aria-pressed={format === 'json'}
            onClick={() => setFormat('json')}
          >
            JSON Object
          </button>
          <button
            type="button"
            className="catalog-playground-option"
            data-active={format === 'tailwind' ? 'true' : 'false'}
            aria-pressed={format === 'tailwind'}
            onClick={() => setFormat('tailwind')}
          >
            Tailwind @theme
          </button>
        </div>

        <div className="catalog-token-export-categories" role="group" aria-label="Token categories">
          {ALL_CATEGORIES.map(({ id, label }) => {
            const active = selectedCategories.includes(id);
            return (
              <label key={id} className="catalog-token-export-check">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleCategory(id)}
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="catalog-token-export-meta">
        <span>
          Active config: <strong>{snapshot.meta.skin}</strong> ·{' '}
          <strong>{snapshot.meta.theme}</strong> · <strong>{snapshot.meta.density}</strong>
        </span>
        <span className="catalog-token-export-filename">{filename}</span>
      </div>

      <pre className="catalog-token-export-preview" data-testid="token-export-preview">
        <code>{exportedOutput}</code>
      </pre>

      <div className="catalog-token-export-actions">
        <Button size="sm" variant="default" onClick={() => handleDownload('css')}>
          Download CSS
        </Button>
        <Button size="sm" variant="secondary" onClick={() => handleDownload('json')}>
          Download JSON
        </Button>
        <Button size="sm" variant="secondary" onClick={() => handleDownload('tailwind')}>
          Download Tailwind
        </Button>
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {copied ? `Copied ${format.toUpperCase()}` : `Copy ${format.toUpperCase()}`}
        </Button>
        {downloadedFile ? (
          <span className="catalog-token-export-status" role="status">
            Saved {downloadedFile}
          </span>
        ) : null}
      </div>
    </div>
  );
}
