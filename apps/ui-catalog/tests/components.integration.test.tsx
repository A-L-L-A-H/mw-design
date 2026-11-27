import { useRef, type ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from '@moonwitness/ui/themes';
import { ComponentPlayground } from '../src/ComponentPlayground.js';
import { AnimatedStudioShowcase } from '../src/AnimatedStudioShowcase.js';
import { AnimeFxLab } from '../src/AnimeFxLab.js';
import { CorePrimitivesShowcase } from '../src/CorePrimitivesShowcase.js';
import { ExampleCopyButton, buildExampleStyleSnippet } from '../src/ExampleCopyButton.js';
import {
  auditElementAccessibility,
  computeContrastRatio,
  parseCssColor,
} from '../src/a11yAudit.js';
import { TokenExportPanel } from '../src/TokenExportPanel.js';
import {
  buildTokenExportFilename,
  collectActiveDesignTokens,
  formatTokensAsCss,
  formatTokensAsJson,
  formatTokensAsTailwindTheme,
} from '../src/tokenExport.js';
import {
  VIEW_TRACKER_STORAGE_KEY,
  clearSectionViews,
  getMostViewedSections,
  readSectionViews,
  recordSectionView,
} from '../src/viewTracker.js';

function TestExample({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <article className="catalog-example" aria-label={title}>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="catalog-stage">{children}</div>
    </article>
  );
}

describe('ComponentPlayground integration', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('updates live Button props, loading state, click count, JSX output, and resets cleanly', async () => {
    const user = userEvent.setup();
    render(<ComponentPlayground />);

    const preview = screen.getByTestId('playground-preview');
    const jsxOutput = screen.getByTestId('playground-jsx-output');

    const previewButton = within(preview).getByRole('button', { name: 'Launch action' });
    expect(previewButton).toHaveAttribute('data-variant', 'default');

    await user.click(previewButton);
    expect(within(preview).getByRole('status')).toHaveTextContent('Clicks: 1');

    // Change variant to magenta and size to lg
    await user.click(screen.getByRole('button', { name: 'magenta' }));
    await user.click(screen.getByRole('button', { name: 'lg' }));
    expect(previewButton).toHaveAttribute('data-variant', 'magenta');
    expect(previewButton).toHaveAttribute('data-size', 'lg');
    expect(jsxOutput).toHaveTextContent('variant="magenta"');
    expect(jsxOutput).toHaveTextContent('size="lg"');

    // Toggle loading state — blocks interaction and marks aria-busy
    await user.click(screen.getByLabelText('Loading state'));
    expect(previewButton).toBeDisabled();
    expect(previewButton).toHaveAttribute('aria-busy', 'true');
    expect(previewButton).toHaveAttribute('data-loading', 'true');
    expect(jsxOutput).toHaveTextContent('loading');

    // Reset props restores defaults
    await user.click(screen.getByRole('button', { name: 'Reset props' }));
    expect(previewButton).not.toBeDisabled();
    expect(previewButton).toHaveAttribute('data-variant', 'default');
    expect(within(preview).getByRole('status')).toHaveTextContent('Clicks: 0');
  });

  it('switches to Alert and Progress tabs and renders interactive state transitions', async () => {
    const user = userEvent.setup();
    render(<ComponentPlayground />);

    const preview = screen.getByTestId('playground-preview');
    const jsxOutput = screen.getByTestId('playground-jsx-output');

    // Alert tab
    await user.click(screen.getByRole('button', { name: 'Alert' }));
    expect(within(preview).getByText('Signal sync active')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'destructive' }));
    expect(within(preview).getByRole('alert')).toHaveAttribute('data-variant', 'destructive');
    expect(jsxOutput).toHaveTextContent('variant="destructive"');

    await user.click(screen.getByLabelText('Dismissible'));
    await user.click(within(preview).getByRole('button', { name: 'Dismiss alert' }));
    expect(within(preview).queryByRole('alert')).not.toBeInTheDocument();

    await user.click(within(preview).getByRole('button', { name: 'Restore alert' }));
    expect(within(preview).getByRole('alert')).toBeInTheDocument();

    // Progress tab
    await user.click(screen.getByRole('button', { name: 'Progress' }));
    const progressbar = within(preview).getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '68');

    await user.click(screen.getByLabelText('Indeterminate mode'));
    expect(progressbar).not.toHaveAttribute('aria-valuenow');
    expect(jsxOutput).toHaveTextContent('indeterminate');
  });

  it('switches border-style and shadow-density design system scales and emits CSS overrides', async () => {
    const user = userEvent.setup();
    render(<ComponentPlayground />);

    const preview = screen.getByTestId('playground-preview');
    const jsxOutput = screen.getByTestId('playground-jsx-output');

    expect(preview).toHaveAttribute('data-border-style', 'default');
    expect(preview).toHaveAttribute('data-shadow-density', 'default');

    const borderGroup = screen.getByRole('group', { name: 'Border style' });
    const shadowGroup = screen.getByRole('group', { name: 'Shadow density' });

    await user.click(within(borderGroup).getByRole('button', { name: 'heavy' }));
    await user.click(within(shadowGroup).getByRole('button', { name: 'impact' }));

    expect(preview).toHaveAttribute('data-border-style', 'heavy');
    expect(preview).toHaveAttribute('data-shadow-density', 'impact');
    expect(jsxOutput).toHaveTextContent('border-style: heavy');
    expect(jsxOutput).toHaveTextContent('--mw-frame-width: 3px');
    expect(jsxOutput).toHaveTextContent('shadow-density: impact');

    await user.click(within(borderGroup).getByRole('button', { name: 'dashed' }));
    await user.click(within(shadowGroup).getByRole('button', { name: 'none' }));
    expect(preview).toHaveAttribute('data-border-style', 'dashed');
    expect(preview).toHaveAttribute('data-shadow-density', 'none');
    expect(jsxOutput).toHaveTextContent('--mw-shadow-ink: none');

    await user.click(screen.getByRole('button', { name: 'Reset props' }));
    expect(preview).toHaveAttribute('data-border-style', 'default');
    expect(preview).toHaveAttribute('data-shadow-density', 'default');
    expect(jsxOutput).not.toHaveTextContent('border-style:');
    expect(jsxOutput).not.toHaveTextContent('shadow-density:');
  });

  it('scans rendered component in the Accessibility Inspector and updates live on state changes', async () => {
    const user = userEvent.setup();
    render(<ComponentPlayground />);

    const a11yPanel = screen.getByTestId('playground-a11y-panel');
    await user.click(within(a11yPanel).getByRole('button', { name: 'Re-scan a11y' }));

    const ariaSection = within(a11yPanel).getByTestId('a11y-aria-section');
    const focusSection = within(a11yPanel).getByTestId('a11y-focus-section');

    expect(ariaSection).toHaveTextContent('Named "Launch action"');
    expect(focusSection).toHaveTextContent('1 keyboard tab stop in order');

    // Clicking the focus stop moves real keyboard focus to the preview button
    await user.click(within(focusSection).getByRole('button', { name: /#1/ }));
    expect(
      within(screen.getByTestId('playground-preview')).getByRole('button', {
        name: 'Launch action',
      })
    ).toHaveFocus();

    // Disabling the button removes active focus stops and notes disabled in ARIA detail
    await user.click(screen.getByLabelText('Disabled state'));
    await user.click(within(a11yPanel).getByRole('button', { name: 'Re-scan a11y' }));
    expect(focusSection).toHaveTextContent('0 active tab stops (control disabled)');
  });
});

describe('a11yAudit helper', () => {
  it('flags missing accessible names, low contrast ratios, and positive tabindex focus order', () => {
    const host = document.createElement('div');
    host.style.backgroundColor = 'rgb(255, 255, 255)';
    host.innerHTML = `
      <button type="button" style="color: rgb(200, 200, 200); background-color: rgb(255, 255, 255);"></button>
      <button type="button" tabindex="2" style="color: rgb(17, 17, 17); background-color: rgb(255, 255, 255);">Second</button>
      <button type="button" tabindex="1" style="color: rgb(17, 17, 17); background-color: rgb(255, 255, 255);">First</button>
    `;
    document.body.appendChild(host);

    try {
      const report = auditElementAccessibility(host);
      expect(report.status).toBe('fail');
      expect(report.ariaChecks.some((c) => c.status === 'fail')).toBe(true);
      expect(report.focusOrder.map((stop) => stop.accessibleName)).toEqual([
        'First',
        'Second',
        '(unlabeled)',
      ]);
      expect(report.focusOrder[0]?.warning).toContain('Positive tabIndex="1"');

      const black = parseCssColor('#000000');
      const white = parseCssColor('rgb(255, 255, 255)');
      const lightGray = parseCssColor('#cccccc');
      expect(black && white ? computeContrastRatio(black, white) : 0).toBe(21);
      expect(lightGray && white ? computeContrastRatio(lightGray, white) : 0).toBeLessThan(2);
    } finally {
      document.body.removeChild(host);
    }
  });
});

describe('CorePrimitivesShowcase integration', () => {
  it('renders and exercises Alert, Progress, Accordion, RadioGroup, Checkbox, and CopyButton', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<CorePrimitivesShowcase Example={TestExample} />);

    // Dismissible destructive Alert
    const alert = screen.getByText('Connection interrupted').closest('[role="alert"]');
    expect(alert).toBeInstanceOf(HTMLElement);
    await user.click(within(alert as HTMLElement).getByRole('button', { name: 'Dismiss alert' }));
    expect(screen.queryByText('Connection interrupted')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restore dismissible alert' }));
    expect(screen.getByText('Connection interrupted')).toBeInTheDocument();

    // Progress advancement
    const pipelineBar = screen.getByRole('progressbar', { name: 'Issue build pipeline' });
    expect(pipelineBar).toHaveAttribute('aria-valuenow', '64');
    await user.click(screen.getByRole('button', { name: 'Advance progress' }));
    expect(pipelineBar).toHaveAttribute('aria-valuenow', '82');

    // Accordion expand/collapse
    const secondTrigger = screen.getByRole('button', { name: 'Works without Tailwind CSS?' });
    expect(secondTrigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(secondTrigger);
    expect(secondTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText(/ships complete CSS inside @moonwitness\/ui\/components\.css/i)
    ).toBeVisible();

    // RadioGroup selection
    expect(screen.getByText('Dispatch channel (editorial)')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Field reporters'));
    expect(screen.getByText('Dispatch channel (field)')).toBeInTheDocument();

    // Custom Checkbox toggle
    const agreeCheckbox = screen.getByRole('checkbox', {
      name: /Custom cross-browser checkbox/i,
    });
    expect(agreeCheckbox).toBeChecked();
    await user.click(agreeCheckbox);
    expect(agreeCheckbox).not.toBeChecked();

    // CopyButton writes import snippet to clipboard and flips label
    const copyImportButton = screen.getByRole('button', { name: 'Copy import' });
    await user.click(copyImportButton);
    expect(writeText).toHaveBeenCalledWith(
      "import { Button, Alert, Card } from '@moonwitness/ui';"
    );
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });
});

describe('ExampleCopyButton integration', () => {
  it('builds a CSS variable + class snippet and copies it to clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    function Harness() {
      const stageRef = useRef<HTMLDivElement>(null);
      return (
        <div>
          <ExampleCopyButton title="Buttons" stageRef={stageRef} />
          <div ref={stageRef}>
            <button type="button" className="mw-ui-button">
              Sample
            </button>
          </div>
        </div>
      );
    }

    render(<Harness />);

    const copyBtn = screen.getByTestId('copy-example-styles');
    expect(copyBtn).toHaveAttribute('data-copied', 'false');

    await user.click(copyBtn);
    expect(writeText).toHaveBeenCalledTimes(1);
    const copiedText = writeText.mock.calls[0]?.[0] as string;
    expect(copiedText).toContain('--mw-primary:');
    expect(copiedText).toContain('.mw-ui-button');
    expect(copyBtn).toHaveAttribute('data-copied', 'true');
    expect(copyBtn).toHaveTextContent('Copied CSS');

    const directSnippet = buildExampleStyleSnippet('Semantic colors', null);
    expect(directSnippet).toContain('--mw-background:');
    expect(directSnippet).toContain('className=');
  });
});

describe('ThemeProvider integration', () => {
  function ThemeHarness() {
    const { mode, density, setMode, setDensity, toggleDark } = useTheme();
    return (
      <div>
        <output data-testid="active-mode">{mode}</output>
        <output data-testid="active-density">{density}</output>
        <button type="button" onClick={() => setMode('dark')}>
          Set dark
        </button>
        <button type="button" onClick={() => setMode('high-contrast')}>
          Set high contrast
        </button>
        <button type="button" onClick={toggleDark}>
          Toggle dark
        </button>
        <button type="button" onClick={() => setDensity('compact')}>
          Compact
        </button>
      </div>
    );
  }

  it('syncs light, dark, high-contrast modes and density to documentElement', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultMode="light">
        <ThemeHarness />
      </ThemeProvider>
    );

    expect(screen.getByTestId('active-mode')).toHaveTextContent('light');
    expect(document.documentElement.dataset.theme).toBe('light');

    await user.click(screen.getByRole('button', { name: 'Set dark' }));
    expect(screen.getByTestId('active-mode')).toHaveTextContent('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Set high contrast' }));
    expect(screen.getByTestId('active-mode')).toHaveTextContent('high-contrast');
    expect(document.documentElement.dataset.theme).toBe('high-contrast');
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Toggle dark' }));
    expect(screen.getByTestId('active-mode')).toHaveTextContent('dark');
    await user.click(screen.getByRole('button', { name: 'Toggle dark' }));
    expect(screen.getByTestId('active-mode')).toHaveTextContent('light');

    await user.click(screen.getByRole('button', { name: 'Compact' }));
    expect(screen.getByTestId('active-density')).toHaveTextContent('compact');
    expect(document.documentElement.dataset.density).toBe('compact');
  });
});

describe('TokenExportPanel & tokenExport integration', () => {
  it('generates CSS and JSON exports reflecting active tokens, filters categories, copies, and triggers download', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const createObjectURL = vi.fn(() => 'blob:mock-tokens');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    document.documentElement.dataset.theme = 'dark';
    document.documentElement.dataset.skin = 'moonwitness-riot';
    document.documentElement.dataset.density = 'compact';

    const snapshot = collectActiveDesignTokens();
    expect(snapshot.meta).toEqual({
      theme: 'dark',
      skin: 'moonwitness-riot',
      density: 'compact',
    });
    expect(buildTokenExportFilename(snapshot, 'css')).toBe(
      'moonwitness-tokens-moonwitness-riot-dark-compact.css'
    );
    expect(formatTokensAsCss(snapshot)).toContain('--mw-background:');
    expect(formatTokensAsCss(snapshot)).toContain('--mw-space-4:');
    expect(formatTokensAsCss(snapshot)).toContain('--mw-font-sans:');
    const parsedJson = JSON.parse(formatTokensAsJson(snapshot)) as {
      meta: { theme: string };
      colors: Record<string, string>;
      spacing: Record<string, string>;
      typography: Record<string, string>;
    };
    expect(parsedJson.meta.theme).toBe('dark');
    expect(parsedJson.colors['--mw-primary']).toBeTruthy();
    expect(parsedJson.spacing['--mw-space-4']).toBeTruthy();
    expect(parsedJson.typography['--mw-font-mono']).toBeTruthy();

    render(
      <TokenExportPanel themeMode="dark" skin="moonwitness-riot" density="compact" />
    );

    const preview = screen.getByTestId('token-export-preview');
    expect(preview).toHaveTextContent(':root {');
    expect(preview).toHaveTextContent('--mw-background:');

    // Toggle off Typography and verify output omits typography tokens
    await user.click(screen.getByLabelText('Typography'));
    expect(preview).not.toHaveTextContent('--mw-font-mono:');

    // Switch to JSON format
    await user.click(screen.getByRole('button', { name: 'JSON Object' }));
    expect(preview).toHaveTextContent('"colors":');
    expect(preview).toHaveTextContent('"spacing":');
    expect(preview).not.toHaveTextContent('"typography":');

    // Copy JSON to clipboard
    await user.click(screen.getByRole('button', { name: 'Copy JSON' }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Copied JSON' })).toBeInTheDocument();

    // Trigger downloadable CSS and JSON files
    await user.click(screen.getByRole('button', { name: 'Download CSS' }));
    await user.click(screen.getByRole('button', { name: 'Download JSON' }));
    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);

    clickSpy.mockRestore();
  });
});

describe('viewTracker localStorage utility', () => {
  const sampleSections = [
    { id: 'foundations', label: 'Foundations' },
    { id: 'core-primitives', label: 'Core primitives' },
    { id: 'forms', label: 'Forms' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'tables', label: 'Tables' },
  ];

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists, ranks by view count with sidebar order tie-breaking, limits results, and clears', () => {
    expect(readSectionViews()).toEqual({});

    recordSectionView('forms');
    recordSectionView('core-primitives');
    recordSectionView('core-primitives');
    recordSectionView('feedback');
    recordSectionView('tables');
    recordSectionView('foundations');

    const stored = readSectionViews();
    expect(stored).toEqual({
      forms: 1,
      'core-primitives': 2,
      feedback: 1,
      tables: 1,
      foundations: 1,
    });

    const ranked = getMostViewedSections(stored, sampleSections, 4);
    expect(ranked.map((entry) => ({ id: entry.section.id, count: entry.count }))).toEqual([
      { id: 'core-primitives', count: 2 },
      { id: 'foundations', count: 1 },
      { id: 'forms', count: 1 },
      { id: 'feedback', count: 1 },
    ]);

    expect(clearSectionViews()).toEqual({});
    expect(window.localStorage.getItem(VIEW_TRACKER_STORAGE_KEY)).toBeNull();
  });

  it('gracefully ignores corrupted localStorage payloads and non-positive counts', () => {
    window.localStorage.setItem(VIEW_TRACKER_STORAGE_KEY, '{not-valid-json');
    expect(readSectionViews()).toEqual({});

    window.localStorage.setItem(
      VIEW_TRACKER_STORAGE_KEY,
      JSON.stringify({ forms: 3, invalid: -2, zero: 0, text: '5' })
    );
    expect(readSectionViews()).toEqual({ forms: 3 });
  });
});

describe('Expanded Playground presets, shareable link, and ComponentApiTable', () => {
  it('supports Card, Switch, Checkbox, and Spinner presets and copies shareable URLs', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<ComponentPlayground />);

    await user.click(screen.getByRole('button', { name: /^Card$/ }));
    expect(screen.getByTestId('playground-jsx-output')).toHaveTextContent('<Card');

    await user.click(screen.getByRole('button', { name: /^Switch$/ }));
    expect(screen.getByTestId('playground-jsx-output')).toHaveTextContent('<Switch');

    await user.click(screen.getByRole('button', { name: /^Checkbox$/ }));
    expect(screen.getByTestId('playground-jsx-output')).toHaveTextContent('<Checkbox');

    await user.click(screen.getByRole('button', { name: /^Spinner$/ }));
    expect(screen.getByTestId('playground-jsx-output')).toHaveTextContent('<Spinner');

    await user.click(screen.getByRole('button', { name: /^Copy share link$/ }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]?.[0]).toContain('pg=spinner');
    expect(screen.getByRole('button', { name: /^Link copied$/ })).toBeInTheDocument();
  });

  it('filters ComponentApiTable by prop/token and copies the selected import snippet', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<CorePrimitivesShowcase Example={TestExample} />);

    const apiRef = screen.getByTestId('component-api-reference');
    const search = within(apiRef).getByRole('searchbox', {
      name: 'Filter component API reference',
    });
    await user.type(search, 'sanitizeUrl');

    expect(
      within(apiRef).getByRole('heading', { name: 'Breadcrumbs & UpdateBanner' })
    ).toBeInTheDocument();
    await user.click(within(apiRef).getByRole('button', { name: 'Copy API import' }));
    expect(writeText).toHaveBeenCalledWith(
      "import { Breadcrumbs, UpdateBanner, sanitizeUrl } from '@moonwitness/ui';"
    );
  });

  it('switches AnimatedStudioShowcase templates (Web/App/Game/Cartoon), viewport, motion profile, and Curve Lab', async () => {
    const user = userEvent.setup();
    render(<AnimatedStudioShowcase />);

    const studio = screen.getByTestId('animated-studio-showcase');
    const stage = within(studio).getByTestId('studio-template-stage');
    expect(stage).toHaveAttribute('data-viewport', 'full');
    expect(stage).toHaveAttribute('data-motion-profile', 'expressive');

    await user.click(within(studio).getByRole('button', { name: 'Game Battle HUD' }));
    expect(within(stage).getAllByText(/BOSS|HP/i).length).toBeGreaterThan(0);

    await user.click(within(studio).getByRole('button', { name: 'Cartoon Studio' }));
    expect(within(stage).getAllByRole('button', { name: /Play|Pause/i }).length).toBeGreaterThan(0);

    await user.click(within(studio).getByRole('button', { name: 'Mobile 390px' }));
    expect(stage).toHaveAttribute('data-viewport', 'mobile');

    await user.click(within(studio).getByRole('button', { name: 'cartoon' }));
    expect(stage).toHaveAttribute('data-motion-profile', 'cartoon');

    const curveLab = within(studio).getByTestId('motion-curve-lab');
    await user.click(within(curveLab).getByRole('button', { name: 'steps-12' }));
    expect(curveLab).toHaveTextContent('curve: steps-12');
  });

  it('switches Genre DNA presets, filters 30-character roster, toggles DnaIcon treatments, and unlocks SkillTree nodes', async () => {
    const user = userEvent.setup();
    render(<AnimatedStudioShowcase />);

    const dnaBar = screen.getByTestId('dna-preset-bar');
    await user.click(within(dnaBar).getByRole('button', { name: 'Shonen Anime' }));
    expect(document.documentElement.dataset.dna).toBe('shonen-anime');

    const roster = screen.getByTestId('character-roster-studio');
    expect(within(roster).getAllByRole('listitem')).toHaveLength(30);
    await user.click(within(roster).getByRole('button', { name: 'Eclipse Bosses' }));
    expect(within(roster).getAllByRole('listitem')).toHaveLength(5);

    const iconStudio = screen.getByTestId('dna-icon-studio');
    await user.click(within(iconStudio).getByRole('button', { name: 'sticker' }));
    expect(iconStudio.querySelector('[data-treatment="sticker"]')).not.toBeNull();

    const skillTree = screen.getByTestId('skill-tree-showcase');
    expect(skillTree).toHaveTextContent('4 SP');
    await user.click(within(skillTree).getByRole('button', { name: /Blade Chain/i }));
    expect(skillTree).toHaveTextContent('3 SP');
  });

  it('supports StatGauge, KineticText, Onomatopoeia presets and Tailwind v4 @theme token export', async () => {
    const user = userEvent.setup();
    render(<ComponentPlayground />);

    await user.click(screen.getByRole('button', { name: /^StatGauge$/ }));
    expect(screen.getByTestId('playground-jsx-output')).toHaveTextContent('<StatGauge');

    await user.click(screen.getByRole('button', { name: /^KineticText$/ }));
    expect(screen.getByTestId('playground-jsx-output')).toHaveTextContent('<KineticText');

    await user.click(screen.getByRole('button', { name: /^Onomatopoeia$/ }));
    expect(screen.getByTestId('playground-jsx-output')).toHaveTextContent('<OnomatopoeiaSFX');

    const snapshot = collectActiveDesignTokens();
    const tw = formatTokensAsTailwindTheme(snapshot);
    expect(tw).toContain('@theme {');
    expect(tw).toContain('--color-mw-primary:');
    expect(buildTokenExportFilename(snapshot, 'tailwind')).toMatch(/\.tailwind\.css$/);
  });

  it('exercises AnimeFxLab screen shake, flash frames, particle bursts, combos, and reduced-motion mode', async () => {
    const user = userEvent.setup();
    render(<AnimeFxLab />);

    const lab = screen.getByTestId('anime-fx-lab');
    const stage = within(lab).getByTestId('anime-fx-stage');
    const status = within(lab).getByTestId('anime-fx-status');
    const jsxOutput = within(lab).getByTestId('anime-fx-jsx-output');

    expect(status).toHaveTextContent('Triggers: 0');
    expect(jsxOutput).toHaveTextContent('characterId="kuro-signal"');

    // Switch stage character and backdrop
    await user.click(within(lab).getByRole('button', { name: 'Vesper' }));
    expect(jsxOutput).toHaveTextContent('characterId="vesper-ink"');

    await user.click(within(lab).getByRole('button', { name: 'Manga Halftone' }));
    expect(stage).toHaveAttribute('data-backdrop', 'manga-halftone');

    // Trigger screen shake, flash frame, and particle burst
    await user.click(within(lab).getByRole('button', { name: 'Trigger Screen Shake' }));
    expect(status).toHaveTextContent('Screen Shake');
    expect(status).toHaveTextContent('Triggers: 1');

    await user.click(within(lab).getByRole('button', { name: 'Trigger Flash Frame' }));
    expect(status).toHaveTextContent('Flash Frame');
    expect(stage).toHaveAttribute('data-flash-active', 'true');

    await user.click(within(lab).getByRole('button', { name: 'Trigger Particle Burst' }));
    expect(status).toHaveTextContent('Particle Burst');
    expect(Number(stage.getAttribute('data-particle-count'))).toBeGreaterThan(0);

    // Trigger choreographed combo
    await user.click(within(lab).getByRole('button', { name: /Volt Awakening/i }));
    expect(status).toHaveTextContent('Combo · Volt Awakening');
    expect(jsxOutput).toHaveTextContent('chromatic-split');

    // Rumble & Shake preset library filtering + trigger + camera dock + sustained loop
    const rumbleLibrary = within(lab).getByTestId('rumble-shake-library');
    await user.click(within(rumbleLibrary).getByRole('button', { name: 'Impact' }));
    expect(rumbleLibrary.querySelectorAll('[data-preset-id]')).toHaveLength(3);
    await user.click(within(rumbleLibrary).getByRole('button', { name: /Seismic Slam/i }));
    expect(stage).toHaveAttribute('data-active-shake-preset', 'seismic-slam');
    expect(stage).toHaveAttribute('data-shake-pattern', 'vertical');
    expect(jsxOutput).toHaveTextContent('seismic-slam');

    // Trigger directly from in-preview camera shake dock
    const cameraDock = within(lab).getByTestId('camera-shake-dock');
    await user.click(
      within(cameraDock).getByRole('button', { name: /Trigger Katana Whiplash in camera preview/i })
    );
    expect(stage).toHaveAttribute('data-active-shake-preset', 'katana-whiplash');
    expect(stage).toHaveAttribute('data-shake-pattern', 'whiplash');

    // Sustained rumble loop + Stop Rumble
    await user.click(within(rumbleLibrary).getByRole('button', { name: 'Sustained' }));
    await user.click(within(rumbleLibrary).getByRole('button', { name: 'Loop Sustained: Off' }));
    await user.click(within(rumbleLibrary).getByRole('button', { name: /Tectonic Rumble/i }));
    expect(stage).toHaveAttribute('data-continuous-rumble', 'true');
    await user.click(within(cameraDock).getByRole('button', { name: 'Stop Rumble' }));
    expect(stage).toHaveAttribute('data-continuous-rumble', 'false');

    // Toggle slow-mo & reduced motion preview
    await user.click(within(lab).getByRole('button', { name: 'Speed: 1x' }));
    expect(status).toHaveTextContent('Playback: 0.25x');

    await user.click(within(lab).getByRole('button', { name: 'Reduced Motion: Off' }));
    expect(stage).toHaveAttribute('data-reduced-motion', 'true');
    expect(jsxOutput).toHaveTextContent('shakeIntensity={0}');

    // Reset clears counters & particles cleanly
    await user.click(within(lab).getByRole('button', { name: 'Reset Stage' }));
    expect(status).toHaveTextContent('Triggers: 0');
    expect(stage).toHaveAttribute('data-particle-count', '0');
  });
});



