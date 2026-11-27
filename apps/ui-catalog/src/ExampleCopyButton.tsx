import { useEffect, useRef, useState, type RefObject } from 'react';

interface ExampleStyleMeta {
  tokens: readonly string[];
  tailwind: string;
}

const DEFAULT_STYLE_META: ExampleStyleMeta = {
  tokens: [
    '--mw-background',
    '--mw-surface',
    '--mw-foreground',
    '--mw-muted-foreground',
    '--mw-border',
    '--mw-primary',
    '--mw-primary-foreground',
    '--mw-shadow-ink',
  ],
  tailwind: 'border-2 border-border bg-card text-card-foreground shadow-ink-sm',
};

const EXAMPLE_STYLE_RULES: ReadonlyArray<{
  match: RegExp;
  meta: ExampleStyleMeta;
}> = [
  {
    match: /semantic colors/i,
    meta: {
      tokens: [
        '--mw-background',
        '--mw-surface',
        '--mw-primary',
        '--mw-destructive',
        '--mw-success',
        '--mw-info',
        '--mw-border',
      ],
      tailwind: 'bg-background bg-card bg-yellow bg-destructive text-foreground border-border',
    },
  },
  {
    match: /identity & status|avatar|badge/i,
    meta: {
      tokens: [
        '--mw-avatar-size',
        '--mw-primary',
        '--mw-primary-foreground',
        '--mw-magenta',
        '--mw-on-magenta',
        '--mw-signal-blue',
        '--mw-destructive',
        '--mw-destructive-foreground',
        '--mw-border',
      ],
      tailwind:
        'inline-flex items-center gap-2 rounded-full border-2 border-border bg-yellow text-ink font-mono text-xs',
    },
  },
  {
    match: /icon/i,
    meta: {
      tokens: ['--mw-foreground', '--mw-ink', '--mw-muted-foreground', '--mw-space-2'],
      tailwind: 'inline-flex items-center gap-2 text-foreground size-5 shrink-0',
    },
  },
  {
    match: /skin & density/i,
    meta: {
      tokens: [
        '--mw-background',
        '--mw-surface',
        '--mw-foreground',
        '--mw-primary',
        '--mw-frame-width',
        '--mw-space-3',
        '--mw-panel-padding-comfortable',
      ],
      tailwind: 'bg-background text-foreground border-2 border-border p-4 gap-3',
    },
  },
  {
    match: /typography|type roles/i,
    meta: {
      tokens: [
        '--mw-font-display',
        '--mw-font-brush',
        '--mw-font-grunge',
        '--mw-font-sans',
        '--mw-font-mono',
        '--mw-font-size-2xl',
        '--mw-line-height-tight',
        '--mw-line-height-normal',
      ],
      tailwind: 'font-display font-brush font-grunge font-sans font-mono text-foreground',
    },
  },
  {
    match: /material|grunge|motion|doodle|motif/i,
    meta: {
      tokens: [
        '--mw-paper',
        '--mw-ink',
        '--mw-yellow',
        '--mw-magenta',
        '--mw-frame-width',
        '--mw-comic-border-width',
        '--mw-shadow-ink',
        '--mw-shadow-comic',
        '--mw-motion-fast',
        '--mw-motion-normal',
        '--mw-motion-ease',
      ],
      tailwind:
        'border-2 border-border bg-paper text-ink shadow-ink-sm transition-colors duration-150',
    },
  },
  {
    match: /button/i,
    meta: {
      tokens: [
        '--mw-primary',
        '--mw-primary-foreground',
        '--mw-secondary',
        '--mw-secondary-foreground',
        '--mw-surface',
        '--mw-surface-foreground',
        '--mw-destructive',
        '--mw-destructive-foreground',
        '--mw-border',
        '--mw-focus',
        '--mw-radius-md',
        '--mw-shadow-ink',
        '--mw-motion-fast',
      ],
      tailwind:
        'inline-flex items-center justify-center gap-2 border-2 border-border bg-yellow text-ink px-4 py-2 font-sans shadow-ink-sm',
    },
  },
  {
    match: /tooltip|toast/i,
    meta: {
      tokens: [
        '--mw-popover',
        '--mw-popover-foreground',
        '--mw-border',
        '--mw-shadow-ink',
        '--mw-layer-popover',
        '--mw-layer-toast',
      ],
      tailwind: 'z-50 border-2 border-border bg-card text-card-foreground px-3 py-1.5 shadow-ink-sm',
    },
  },
  {
    match: /field|input|validation|filter|date|number|tag|label/i,
    meta: {
      tokens: [
        '--mw-surface',
        '--mw-surface-foreground',
        '--mw-input',
        '--mw-border',
        '--mw-focus',
        '--mw-muted',
        '--mw-muted-foreground',
        '--mw-error',
        '--mw-radius-sm',
      ],
      tailwind:
        'flex w-full border-2 border-border bg-card text-card-foreground px-3 py-2 text-sm focus-visible:outline-3',
    },
  },
  {
    match: /dialog|popover|sheet|dropdown|command|confirm|inbox|mode picker/i,
    meta: {
      tokens: [
        '--mw-popover',
        '--mw-popover-foreground',
        '--mw-surface',
        '--mw-border',
        '--mw-backdrop',
        '--mw-focus',
        '--mw-shadow-ink-lg',
        '--mw-layer-dialog',
        '--mw-layer-popover',
      ],
      tailwind:
        'z-50 border-2 border-border bg-card text-card-foreground p-6 shadow-ink-lg max-h-dvh overflow-hidden',
    },
  },
  {
    match: /tabs|toolbar|page header|breadcrumb|ribbon|status bar|update banner/i,
    meta: {
      tokens: [
        '--mw-surface',
        '--mw-surface-foreground',
        '--mw-primary',
        '--mw-primary-foreground',
        '--mw-muted',
        '--mw-border',
        '--mw-font-display',
        '--mw-space-4',
      ],
      tailwind:
        'flex flex-wrap items-center justify-between gap-4 border-2 border-border bg-card px-4 py-3 text-card-foreground',
    },
  },
  {
    match: /table|pagination|kanban|loading|empty|error|log/i,
    meta: {
      tokens: [
        '--mw-surface',
        '--mw-surface-foreground',
        '--mw-muted',
        '--mw-muted-foreground',
        '--mw-border',
        '--mw-border-subtle',
        '--mw-focus',
        '--mw-shadow-ink',
      ],
      tailwind:
        'w-full border-2 border-border bg-card text-card-foreground shadow-ink-sm divide-y divide-border',
    },
  },
  {
    match: /chart/i,
    meta: {
      tokens: [
        '--mw-chart-1',
        '--mw-chart-2',
        '--mw-chart-3',
        '--mw-chart-4',
        '--mw-chart-5',
        '--mw-surface',
        '--mw-foreground',
        '--mw-border',
      ],
      tailwind: 'border-2 border-border bg-card text-card-foreground p-4 shadow-ink-sm',
    },
  },
  {
    match: /comic|manga|riot|character|quest|sticker|hero|editorial|board|workbench|brand/i,
    meta: {
      tokens: [
        '--mw-paper',
        '--mw-paper-raised',
        '--mw-ink',
        '--mw-yellow',
        '--mw-magenta',
        '--mw-signal-blue',
        '--mw-comic-border-width',
        '--mw-shadow-comic',
        '--mw-shadow-anime-impact',
      ],
      tailwind:
        'relative border-2 border-border bg-paper text-ink p-4 shadow-ink-lg font-display',
    },
  },
];

function resolveStyleMeta(title: string): ExampleStyleMeta {
  for (const rule of EXAMPLE_STYLE_RULES) {
    if (rule.match.test(title)) {
      return rule.meta;
    }
  }
  return DEFAULT_STYLE_META;
}

function collectRenderedClasses(stageElement: HTMLElement | null): string[] {
  if (!stageElement) return [];
  const classes = new Set<string>();
  const nodes = [stageElement, ...stageElement.querySelectorAll<HTMLElement>('[class]')];
  for (const node of nodes) {
    for (const token of node.classList) {
      if (token.startsWith('catalog-')) continue;
      classes.add(token);
      if (classes.size >= 16) return [...classes];
    }
  }
  return [...classes];
}

export function buildExampleStyleSnippet(
  title: string,
  stageElement: HTMLElement | null
): string {
  const meta = resolveStyleMeta(title);
  const root = document.documentElement;
  const computed = getComputedStyle(root);
  const activeTheme = root.dataset.theme ?? (root.classList.contains('dark') ? 'dark' : 'light');
  const activeSkin = root.dataset.skin ?? 'moonwitness-ink';

  const cssVars = meta.tokens
    .map((token) => {
      const value = computed.getPropertyValue(token).trim() || 'unset';
      return `  ${token}: ${value};`;
    })
    .join('\n');

  const renderedClasses = collectRenderedClasses(stageElement);
  const componentClasses = renderedClasses.filter((cls) => cls.startsWith('mw-ui-'));
  const utilityClasses = renderedClasses.filter((cls) => !cls.startsWith('mw-ui-'));

  const lines = [
    `/* ${title} — MoonWitness CSS variables (theme: ${activeTheme}, skin: ${activeSkin}) */`,
    ':root {',
    cssVars,
    '}',
    '',
    `/* Tailwind class structure */`,
    `className="${utilityClasses.length > 0 ? utilityClasses.join(' ') : meta.tailwind}"`,
  ];

  if (componentClasses.length > 0) {
    lines.push(`/* Component classes: ${componentClasses.map((cls) => `.${cls}`).join(' ')} */`);
  }

  return lines.join('\n');
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below when Clipboard API is blocked in restricted iframes.
    }
  }
  if (typeof document === 'undefined') return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
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

export function ExampleCopyButton({
  title,
  stageRef,
}: {
  title: string;
  stageRef: RefObject<HTMLDivElement | null>;
}) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    const snippet = buildExampleStyleSnippet(title, stageRef.current);
    const success = await copyTextToClipboard(snippet);
    if (!success) return;
    setCopied(true);
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      resetTimerRef.current = null;
    }, 2000);
  }

  return (
    <div className="catalog-example-actions">
      <button
        type="button"
        className="catalog-copy-button"
        data-copied={copied ? 'true' : 'false'}
        data-testid="copy-example-styles"
        aria-label={
          copied
            ? `Copied CSS variables and Tailwind classes for ${title}`
            : `Copy CSS variables and Tailwind classes for ${title}`
        }
        onClick={handleCopy}
      >
        {copied ? (
          <svg
            viewBox="0 0 16 16"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3.2 8.4 6.5 11.7 12.8 4.8" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 16 16"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="5.5" y="5.5" width="8" height="8" rx="1" />
            <path d="M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
          </svg>
        )}
        <span>{copied ? 'Copied CSS' : 'Copy CSS'}</span>
      </button>
    </div>
  );
}
