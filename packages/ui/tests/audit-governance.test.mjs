import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';

const uiRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

test('sanitizeUrl blocks dangerous schemes and preserves safe relative and absolute links', async () => {
  const { sanitizeUrl } = await import('../dist/lib/sanitize-url.js');

  assert.equal(sanitizeUrl('javascript:alert(1)'), undefined);
  assert.equal(sanitizeUrl('  JAVASCRIPT:alert(1)  '), undefined);
  assert.equal(sanitizeUrl('java\u0000script:alert(1)'), undefined);
  assert.equal(sanitizeUrl('data:text/html,<script>alert(1)</script>'), undefined);
  assert.equal(sanitizeUrl('vbscript:msgbox(1)'), undefined);
  assert.equal(sanitizeUrl('//evil.example/phish'), undefined);
  assert.equal(sanitizeUrl('   '), undefined);
  assert.equal(sanitizeUrl(undefined), undefined);

  assert.equal(sanitizeUrl('/docs/tokens'), '/docs/tokens');
  assert.equal(sanitizeUrl('./overview'), './overview');
  assert.equal(sanitizeUrl('../guide'), '../guide');
  assert.equal(sanitizeUrl('#playground'), '#playground');
  assert.equal(sanitizeUrl('?pg=card'), '?pg=card');
  assert.equal(sanitizeUrl('https://moonwitness.dev/releases'), 'https://moonwitness.dev/releases');
  assert.equal(sanitizeUrl('http://localhost:3000/'), 'http://localhost:3000/');
  assert.equal(sanitizeUrl('mailto:ops@moonwitness.dev'), 'mailto:ops@moonwitness.dev');
  assert.equal(sanitizeUrl('tel:+628123456789'), 'tel:+628123456789');
});

test('Breadcrumbs and UpdateBanner strip unsafe javascript: URLs from rendered links', async () => {
  const { Breadcrumbs } = await import('../dist/components/breadcrumbs.js');
  const { UpdateBanner } = await import('../dist/components/update-banner.js');

  const crumbsHtml = renderToStaticMarkup(
    React.createElement(Breadcrumbs, {
      items: [
        { label: 'Home', href: '/home' },
        { label: 'Blocked', href: 'javascript:alert(1)' },
        { label: 'Current' },
      ],
    })
  );
  assert.match(crumbsHtml, /href="\/home"/);
  assert.doesNotMatch(crumbsHtml, /javascript:/i);

  const bannerHtml = renderToStaticMarkup(
    React.createElement(UpdateBanner, {
      currentVersion: '1.0.0',
      availableVersion: '1.1.0',
      status: 'available',
      releaseUrl: 'javascript:alert(1)',
    })
  );
  assert.doesNotMatch(bannerHtml, /javascript:/i);
  assert.doesNotMatch(bannerHtml, /Release Notes/);

  const safeBannerHtml = renderToStaticMarkup(
    React.createElement(UpdateBanner, {
      currentVersion: '1.0.0',
      availableVersion: '1.1.0',
      status: 'available',
      releaseUrl: 'https://github.com/MoonWitness/moonwitness-design/releases',
    })
  );
  assert.match(safeBannerHtml, /Release Notes/);
  assert.match(safeBannerHtml, /https:\/\/github\.com\/MoonWitness\/moonwitness-design\/releases/);
});

test('ToastHost renders safely during SSR without throwing when document is undefined', async () => {
  const { ToastHost } = await import('../dist/components/toast.js');
  assert.doesNotThrow(() => {
    renderToStaticMarkup(React.createElement(ToastHost));
  });
});

test('createSkinInitScript hydrates mode, high-contrast class, skin, and density from mw-ui-theme', async () => {
  const { createSkinInitScript, DEFAULT_THEME_STORAGE_KEY } = await import('../dist/themes/index.js');

  assert.equal(DEFAULT_THEME_STORAGE_KEY, 'mw-ui-theme');

  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    url: 'http://localhost/',
    runScripts: 'dangerously',
  });
  dom.window.localStorage.setItem(
    DEFAULT_THEME_STORAGE_KEY,
    JSON.stringify({ mode: 'high-contrast', skin: 'moonwitness-riot', density: 'compact' })
  );

  const scriptEl = dom.window.document.createElement('script');
  scriptEl.textContent = createSkinInitScript();
  dom.window.document.head.appendChild(scriptEl);

  const root = dom.window.document.documentElement;
  assert.equal(root.dataset.theme, 'high-contrast');
  assert.equal(root.dataset.skin, 'moonwitness-riot');
  assert.equal(root.dataset.density, 'compact');
  assert.equal(root.classList.contains('high-contrast'), true);
  assert.equal(root.classList.contains('dark'), false);
});

test('root barrel exports core primitives, overlays, themes, and sanitizeUrl without optional peers', async () => {
  const ui = await import('../dist/index.js');

  for (const name of [
    'Button',
    'Card',
    'Alert',
    'Dialog',
    'DialogContent',
    'Sheet',
    'SheetContent',
    'Popover',
    'Tooltip',
    'DropdownMenu',
    'Select',
    'Tabs',
    'Table',
    'Breadcrumbs',
    'UpdateBanner',
    'ModePicker',
    'LogConsole',
    'MetricTile',
    'ThemeProvider',
    'useTheme',
    'createSkinInitScript',
    'DEFAULT_THEME_STORAGE_KEY',
    'sanitizeUrl',
  ]) {
    assert.ok(name in ui, `Expected root export "${name}" in @moonwitness/ui`);
  }

  // Optional peer-dep modules (cmdk / sonner) stay scoped to subpaths so consumers without them can import root cleanly.
  assert.equal('Command' in ui, false);
  assert.equal('ToastHost' in ui, false);
});

test('all interactive UI components declare use client and contain zero Tailwind utility leaks', () => {
  const componentsDir = join(uiRoot, 'src/components');
  const files = readdirSync(componentsDir).filter((f) => f.endsWith('.tsx')).sort();

  const twLeak =
    /\b(bg-\[|text-\[|border-\[|flex-col|items-center|justify-between|gap-[0-9]|px-[0-9]|py-[0-9]|rounded-(?:md|lg|xl|sm|full)|shadow-(?:md|lg|sm|xl)|z-50|w-full|h-full)\b/;
  const interactive =
    /\b(useState|useEffect|useRef|useCallback|useMemo|useId|useContext|useLayoutEffect|createContext|onClick|onChange|onKeyDown|onSubmit)\b|from\s+['"]radix-ui['"]/;

  for (const file of files) {
    const src = readFileSync(join(componentsDir, file), 'utf8');
    assert.doesNotMatch(src, twLeak, `Unexpected Tailwind utility in ${file}`);
    if (interactive.test(src)) {
      assert.match(src, /^['"]use client['"];?/m, `Missing 'use client' directive in ${file}`);
    }
  }
});
