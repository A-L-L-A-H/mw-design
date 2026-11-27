import { useMemo, useState } from 'react';
import { Badge, CopyButton, Input } from '@moonwitness/ui';

export type ApiPropSpec = {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
};

export type ComponentApiSpec = {
  id: string;
  name: string;
  category: 'Core' | 'Form' | 'Overlay' | 'Feedback' | 'Theme';
  importSnippet: string;
  summary: string;
  props: readonly ApiPropSpec[];
  tokens: readonly string[];
};

export const COMPONENT_API_SPECS: readonly ComponentApiSpec[] = [
  {
    id: 'button',
    name: 'Button',
    category: 'Core',
    importSnippet: "import { Button } from '@moonwitness/ui';",
    summary: 'Polymorphic action trigger with brush/solid treatments, loading guard, and ref forwarding.',
    props: [
      {
        name: 'variant',
        type: "'default' | 'magenta' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'",
        defaultValue: "'default'",
        description: 'Semantic visual emphasis and surface contrast.',
      },
      {
        name: 'size',
        type: "'xs' | 'sm' | 'default' | 'lg' | 'icon-sm' | 'icon' | 'icon-lg'",
        defaultValue: "'default'",
        description: 'Control height, horizontal rhythm, or square icon dimensions.',
      },
      {
        name: 'treatment',
        type: "'solid' | 'brush'",
        defaultValue: "'solid'",
        description: 'Switches between crisp ink-bordered frames and brush-clipped zine shapes.',
      },
      {
        name: 'loading',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Shows an inline spinner, sets aria-busy, and blocks duplicate clicks.',
      },
      {
        name: 'asChild',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Renders props onto the single child element via Radix Slot.',
      },
    ],
    tokens: ['--mw-primary', '--mw-magenta', '--mw-frame-width', '--mw-shadow-ink'],
  },
  {
    id: 'card',
    name: 'Card',
    category: 'Core',
    importSnippet: "import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@moonwitness/ui';",
    summary: 'Structured container surface with header, body, and footer slots across elevation variants.',
    props: [
      {
        name: 'variant',
        type: "'default' | 'elevated' | 'muted' | 'interactive'",
        defaultValue: "'default'",
        description: 'Controls border contrast, shadow depth, and hover lift.',
      },
      {
        name: 'padding',
        type: "'none' | 'sm' | 'md' | 'lg'",
        defaultValue: "'md'",
        description: 'Internal padding scale applied across card sections.',
      },
    ],
    tokens: ['--mw-card', '--mw-card-foreground', '--mw-border', '--mw-shadow-ink'],
  },
  {
    id: 'alert',
    name: 'Alert',
    category: 'Feedback',
    importSnippet: "import { Alert, AlertTitle, AlertDescription } from '@moonwitness/ui';",
    summary: 'Inline status callout supporting accessible live semantics and optional dismissal.',
    props: [
      {
        name: 'variant',
        type: "'default' | 'info' | 'success' | 'warning' | 'destructive'",
        defaultValue: "'default'",
        description: 'Semantic border accent and icon tone.',
      },
      {
        name: 'onDismiss',
        type: '() => void',
        defaultValue: 'undefined',
        description: 'Renders an accessible close button when supplied.',
      },
    ],
    tokens: ['--mw-info', '--mw-success', '--mw-warning', '--mw-destructive'],
  },
  {
    id: 'field',
    name: 'Field & Input',
    category: 'Form',
    importSnippet: "import { Field, Input } from '@moonwitness/ui';",
    summary: 'Accessible form field wrapper wiring label, description, error message, and aria-describedby automatically.',
    props: [
      {
        name: 'label',
        type: 'ReactNode',
        defaultValue: 'required',
        description: 'Visible label bound to the child input via htmlFor.',
      },
      {
        name: 'description',
        type: 'ReactNode',
        defaultValue: 'undefined',
        description: 'Helper text linked via aria-describedby.',
      },
      {
        name: 'error',
        type: 'ReactNode',
        defaultValue: 'undefined',
        description: 'Validation message; automatically sets aria-invalid on the child control.',
      },
      {
        name: 'required',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Displays a required indicator and marks the input required.',
      },
    ],
    tokens: ['--mw-input', '--mw-ring', '--mw-destructive', '--mw-muted-foreground'],
  },
  {
    id: 'switch-checkbox',
    name: 'Switch & Checkbox',
    category: 'Form',
    importSnippet: "import { Switch, Checkbox } from '@moonwitness/ui';",
    summary: 'Cross-browser binary toggles with pure CSS skins and indeterminate Checkbox ref support.',
    props: [
      {
        name: 'checked',
        type: 'boolean',
        defaultValue: 'undefined',
        description: 'Controlled toggle state.',
      },
      {
        name: 'size (Switch)',
        type: "'sm' | 'default'",
        defaultValue: "'default'",
        description: 'Compact or standard track and thumb dimensions.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Prevents pointer/keyboard interaction and dims surface contrast.',
      },
    ],
    tokens: ['--mw-primary', '--mw-border-strong', '--mw-ring', '--mw-surface-elevated'],
  },
  {
    id: 'dialog-sheet',
    name: 'Dialog & Sheet',
    category: 'Overlay',
    importSnippet: "import { Dialog, DialogTrigger, DialogContent, Sheet, SheetContent } from '@moonwitness/ui';",
    summary: 'Accessible modal and slide-over overlays powered by Radix primitives with zero Tailwind runtime dependency.',
    props: [
      {
        name: 'open / onOpenChange',
        type: 'boolean / (open: boolean) => void',
        defaultValue: 'uncontrolled',
        description: 'Controlled visibility state for modal or drawer.',
      },
      {
        name: 'showCloseButton',
        type: 'boolean',
        defaultValue: 'true',
        description: 'Toggles the top-right accessible close trigger.',
      },
      {
        name: 'side (SheetContent)',
        type: "'top' | 'right' | 'bottom' | 'left'",
        defaultValue: "'right'",
        description: 'Viewport edge from which the slide-over drawer enters.',
      },
    ],
    tokens: ['--mw-popover', '--mw-border-strong', '--mw-shadow-ink-lg', '--mw-motion-normal'],
  },
  {
    id: 'breadcrumbs-banner',
    name: 'Breadcrumbs & UpdateBanner',
    category: 'Feedback',
    importSnippet: "import { Breadcrumbs, UpdateBanner, sanitizeUrl } from '@moonwitness/ui';",
    summary: 'Navigation trails and release update banners with built-in safe URL validation on dynamic links.',
    props: [
      {
        name: 'items (Breadcrumbs)',
        type: 'readonly { label: string; href?: string; onClick?: () => void }[]',
        defaultValue: 'required',
        description: 'Trail segments; unsafe URL schemes are filtered automatically.',
      },
      {
        name: 'status (UpdateBanner)',
        type: "'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'",
        defaultValue: "'idle'",
        description: 'Controls live status messaging and primary action button.',
      },
      {
        name: 'releaseUrl (UpdateBanner)',
        type: 'string',
        defaultValue: 'undefined',
        description: 'Optional release-notes link validated via sanitizeUrl().',
      },
    ],
    tokens: ['--mw-border', '--mw-primary', '--mw-muted-foreground', '--mw-destructive'],
  },
  {
    id: 'theme-provider',
    name: 'ThemeProvider',
    category: 'Theme',
    importSnippet: "import { ThemeProvider, useTheme, createSkinInitScript } from '@moonwitness/ui';",
    summary: 'Root context synchronizing light, dark, and high-contrast modes, skins, density, and SSR no-flash script.',
    props: [
      {
        name: 'defaultMode',
        type: "'light' | 'dark' | 'high-contrast'",
        defaultValue: "'light'",
        description: 'Initial color mode before persisted storage overrides.',
      },
      {
        name: 'defaultSkin',
        type: 'SkinId',
        defaultValue: "'signal-riot'",
        description: 'Active visual skin applied to data-skin.',
      },
      {
        name: 'defaultDensity',
        type: "'comfortable' | 'compact'",
        defaultValue: "'comfortable'",
        description: 'Global layout rhythm applied to data-density.',
      },
      {
        name: 'storageKey',
        type: 'string',
        defaultValue: "'mw-ui-theme'",
        description: 'Local storage key shared with createSkinInitScript({ storageKey }).',
      },
    ],
    tokens: ['--mw-background', '--mw-foreground', '--mw-surface-elevated', '--mw-font-display'],
  },
];

export function ComponentApiTable() {
  const [selectedId, setSelectedId] = useState<string>(COMPONENT_API_SPECS[0].id);
  const [query, setQuery] = useState('');

  const filteredSpecs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMPONENT_API_SPECS;
    return COMPONENT_API_SPECS.filter(
      (spec) =>
        spec.name.toLowerCase().includes(q) ||
        spec.category.toLowerCase().includes(q) ||
        spec.props.some(
          (prop) =>
            prop.name.toLowerCase().includes(q) || prop.description.toLowerCase().includes(q)
        ) ||
        spec.tokens.some((token) => token.toLowerCase().includes(q))
    );
  }, [query]);

  const activeSpec =
    filteredSpecs.find((spec) => spec.id === selectedId) ?? filteredSpecs[0] ?? null;

  return (
    <div className="catalog-api-ref" data-testid="component-api-reference">
      <div className="catalog-api-toolbar">
        <div className="catalog-api-tabs" role="group" aria-label="Component API selector">
          {filteredSpecs.map((spec) => {
            const active = activeSpec?.id === spec.id;
            return (
              <button
                key={spec.id}
                type="button"
                className="catalog-playground-tab"
                data-active={active ? 'true' : 'false'}
                aria-pressed={active}
                onClick={() => setSelectedId(spec.id)}
              >
                {spec.name}
              </button>
            );
          })}
        </div>
        <div className="catalog-api-search">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter component, prop, or CSS token..."
            aria-label="Filter component API reference"
          />
        </div>
      </div>

      {activeSpec ? (
        <div className="catalog-api-card">
          <div className="catalog-api-header">
            <div>
              <div className="catalog-api-title-row">
                <h4 className="catalog-api-name">{activeSpec.name}</h4>
                <Badge size="sm" variant="primary">
                  {activeSpec.category}
                </Badge>
              </div>
              <p className="catalog-api-summary">{activeSpec.summary}</p>
            </div>
            <CopyButton value={activeSpec.importSnippet} label="Copy API import" />
          </div>

          <pre className="catalog-api-import">
            <code>{activeSpec.importSnippet}</code>
          </pre>

          <div className="catalog-api-table-wrap">
            <table className="catalog-api-table">
              <thead>
                <tr>
                  <th scope="col">Prop</th>
                  <th scope="col">Type</th>
                  <th scope="col">Default</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                {activeSpec.props.map((prop) => (
                  <tr key={prop.name}>
                    <td>
                      <code>{prop.name}</code>
                    </td>
                    <td>
                      <code>{prop.type}</code>
                    </td>
                    <td>
                      <code>{prop.defaultValue}</code>
                    </td>
                    <td>{prop.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="catalog-api-tokens" aria-label="Related CSS design tokens">
            <span className="catalog-api-tokens-label">CSS tokens:</span>
            {activeSpec.tokens.map((token) => (
              <code key={token} className="catalog-api-token-chip">
                {token}
              </code>
            ))}
          </div>
        </div>
      ) : (
        <p className="catalog-api-empty">No matching component API entries for &ldquo;{query}&rdquo;.</p>
      )}
    </div>
  );
}
