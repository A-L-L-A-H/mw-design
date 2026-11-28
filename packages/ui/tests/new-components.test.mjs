import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

// Pre-install a jsdom before any dist module is loaded: Radix captures
// module-scope DOM references at import time, so portals need a document
// to exist on the first import or they silently render nothing.
function installDomGlobals(dom, saved = new Map()) {
  const assignGlobal = (key, value) => {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  };
  for (const key of [
    'window', 'document', 'navigator', 'HTMLElement', 'HTMLFormElement', 'HTMLButtonElement',
    'Element', 'Node', 'NodeFilter', 'MutationObserver', 'Event', 'CustomEvent',
    'KeyboardEvent', 'MouseEvent',
  ]) {
    assignGlobal(key, dom.window[key]);
  }
  assignGlobal('getComputedStyle', dom.window.getComputedStyle.bind(dom.window));
  assignGlobal('requestAnimationFrame', dom.window.requestAnimationFrame.bind(dom.window));
  assignGlobal('cancelAnimationFrame', dom.window.cancelAnimationFrame.bind(dom.window));
  assignGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  assignGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  if (!dom.window.Element.prototype.scrollIntoView) {
    dom.window.Element.prototype.scrollIntoView = () => {};
  }
  return saved;
}

const { JSDOM } = await import('jsdom');
const bootDom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});
installDomGlobals(bootDom);

test('new component subpaths are exported in package.json', () => {
  for (const subpath of [
    './components/confirm-dialog',
    './components/error-state',
    './components/breadcrumbs',
    './components/brand-mark',
    './components/inbox-popover',
  ]) {
    assert.ok(packageJson.exports[subpath], `Missing package export for ${subpath}`);
  }
});

test('ErrorState, Breadcrumbs, BrandMark, EmptyState illustration, Pagination trailing, and CX-018 variants render cleanly', async () => {
  const [
    { ErrorState },
    { Breadcrumbs },
    { BrandMark },
    { EmptyState },
    { Pagination },
    { SectionRibbon },
    { Panel },
    { MetricTile },
    { PageHeader },
    { Select, SelectTrigger, SelectValue },
  ] = await Promise.all([
    import('../dist/components/error-state.js'),
    import('../dist/components/breadcrumbs.js'),
    import('../dist/components/brand-mark.js'),
    import('../dist/components/empty-state.js'),
    import('../dist/components/pagination.js'),
    import('../dist/components/section-ribbon.js'),
    import('../dist/components/panel.js'),
    import('../dist/components/metric-tile.js'),
    import('../dist/components/page-header.js'),
    import('../dist/components/select.js'),
  ]);
  const html = renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(ErrorState, {
        code: '404',
        title: 'Signal missing',
        description: 'Page not found.',
        stateSlug: 'not-found',
        basePath: '/app',
        onRetry: () => {},
        retrying: true,
        secondaryAction: React.createElement('a', { href: '/' }, 'Go home'),
      }),
      React.createElement(Breadcrumbs, {
        items: [
          { label: 'Board', href: '/board' },
          { label: 'Projects', current: true },
        ],
      }),
      React.createElement(BrandMark, {
        variant: 'symbol',
        tone: 'light',
        basePath: '/app',
      }),
      React.createElement(EmptyState, {
        title: 'No search results',
        illustration: 'no-search-results',
        basePath: '/app',
      }),
      React.createElement(Pagination, {
        page: 2,
        pageCount: 5,
        onPageChange: () => {},
        trailing: React.createElement('span', null, '25 per page'),
      }),
      React.createElement(SectionRibbon, {
        title: 'Compact Ribbon',
        size: 'sm',
        treatment: 'brush',
      }),
      React.createElement(
        Panel,
        {
          title: 'Micro Panel',
          density: 'micro',
          contentClassName: 'custom-panel-body',
        },
        'Body'
      ),
      React.createElement(MetricTile, {
        label: 'Hero KPI',
        value: '42',
        accent: 'magenta',
        size: 'hero',
        interactive: true,
      }),
      React.createElement(PageHeader, {
        title: 'Catalog Hero',
        scale: 'hero',
      }),
      React.createElement(
        Select,
        null,
        React.createElement(
          SelectTrigger,
          { fullWidth: true },
          React.createElement(SelectValue, { placeholder: 'Pick' })
        )
      )
    )
  );

  assert.match(html, /role="alert"[^>]*data-slot="error-state"/u);
  assert.match(html, /\/app\/illustrations\/riot-universe\/states\/state-not-found\.webp/u);
  assert.match(html, /aria-busy="true"/u);
  assert.match(html, /Go home/u);

  assert.match(html, /data-slot="breadcrumbs"/u);
  assert.match(html, /href="\/board"/u);
  assert.match(html, /aria-current="page">Projects</u);

  assert.match(html, /data-slot="brand-mark"[^>]*data-variant="symbol"[^>]*data-tone="light"/u);
  assert.match(html, /\/app\/brand\/moonwitness-symbol-light\.svg/u);

  assert.match(html, /mw-ui-empty-state-illustration/u);
  assert.match(html, /\/app\/illustrations\/riot-universe\/states\/state-no-search-results\.webp/u);

  assert.match(html, /mw-ui-pagination-trailing/u);
  assert.match(html, /25 per page/u);

  assert.match(html, /data-size="sm"[^>]*data-treatment="brush"/u);
  assert.match(html, /data-density="micro"/u);
  assert.match(html, /mw-ui-panel-content custom-panel-body/u);
  assert.match(html, /data-interactive="true" data-size="hero"/u);
  assert.match(html, /data-scale="hero"/u);
  assert.match(html, /data-full-width="true"/u);
});

test('root barrel exports all 9 non-optional-peer visual, scene, and effect modules', async () => {
  const ui = await import('../dist/index.js');
  for (const symbol of [
    'CharacterPreview',
    'CharacterDisplay',
    'CharacterReaction',
    'ComicTheater',
    'EditorialTexture',
    'EffectsSpeechBubble',
    'MangaPanel',
    'EpistemicBranchPanel',
    'LayeredScene',
    'resolveSceneLayersForWidth',
    'SceneParticles',
    'generateSceneParticles',
    'ComicSceneTransition',
    'SpritePlayer',
    'computeSpriteFrameIndex',
  ]) {
    assert.ok(symbol in ui, `Expected ${symbol} to be exported from @moonwitness/ui root barrel`);
  }
});

async function withDom(run) {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });
  const saved = new Map();
  const assignGlobal = (key, value) => {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  };
  for (const key of [
    'window', 'document', 'navigator', 'HTMLElement', 'HTMLFormElement', 'HTMLButtonElement',
    'Element', 'Node', 'NodeFilter', 'MutationObserver', 'Event', 'CustomEvent',
    'KeyboardEvent', 'MouseEvent',
  ]) {
    assignGlobal(key, dom.window[key]);
  }
  assignGlobal('getComputedStyle', dom.window.getComputedStyle.bind(dom.window));
  assignGlobal('requestAnimationFrame', dom.window.requestAnimationFrame.bind(dom.window));
  assignGlobal('cancelAnimationFrame', dom.window.cancelAnimationFrame.bind(dom.window));
  assignGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  assignGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  if (!dom.window.Element.prototype.scrollIntoView) {
    dom.window.Element.prototype.scrollIntoView = () => {};
  }
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root'));
  try {
    return await run({ dom, root, doc: globalThis.document });
  } finally {
    await React.act(async () => root.unmount());
    globalThis.document.querySelectorAll('[data-radix-portal]').forEach((el) => el.remove());
    for (const [key, desc] of saved.entries()) {
      if (desc) Object.defineProperty(globalThis, key, desc);
      else delete globalThis[key];
    }
  }
}

function findButtonByText(container, text) {
  return [...container.querySelectorAll('button')].find((btn) => btn.textContent?.trim() === text);
}

test('AppearanceMenu opens popover and drives controlled & uncontrolled mode, density, and toggles', async () => {
  await withDom(async ({ dom, root, doc }) => {
  const { AppearanceMenu } = await import('../dist/index.js');
    const modes = [];
    const densities = [];
    const toggled = [];
    await React.act(async () => {
      root.render(
        React.createElement(AppearanceMenu, {
          mode: 'light',
          onModeChange: (m) => modes.push(m),
          density: 'comfortable',
          onDensityChange: (d) => densities.push(d),
          toggles: [{ id: 'motion', label: 'Reduced motion', checked: false, onChange: (v) => toggled.push(v) }],
        })
      );
    });
    const trigger = doc.querySelector('button[aria-label="Display & theme preferences"]');
    assert.ok(trigger);
    await React.act(async () => {
      trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
    const darkBtn = findButtonByText(globalThis.document.body, 'Dark');
    const compactBtn = findButtonByText(globalThis.document.body, 'Compact');
    const switchEl = globalThis.document.body.querySelector('[role="switch"]');
    assert.ok(darkBtn && compactBtn && switchEl);
    await React.act(async () => {
      darkBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      compactBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      switchEl.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
    assert.deepEqual(modes, ['dark']);
    assert.deepEqual(densities, ['compact']);
    assert.deepEqual(toggled, [true]);

    await React.act(async () => {
      root.render(React.createElement(AppearanceMenu, { ariaLabel: 'Custom display' }));
    });
    const customBtn = doc.querySelector('button[aria-label="Custom display"]');
    assert.ok(customBtn);
    await React.act(async () => {
      findButtonByText(globalThis.document.body, 'Contrast')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
    assert.equal(doc.documentElement.dataset.theme, 'high-contrast');
    assert.equal(doc.documentElement.classList.contains('high-contrast'), true);
  });
});

test('Command renders static markup and filters/selects items in CommandDialog', async () => {
  const {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
  } = await import('../dist/components/command.js');

  const ssrHtml = renderToStaticMarkup(
    React.createElement(
      Command,
      null,
      React.createElement(CommandInput, { placeholder: 'Filter commands' }),
      React.createElement(
        CommandList,
        null,
        React.createElement(CommandEmpty, null, 'No results'),
        React.createElement(
          CommandGroup,
          { heading: 'Actions' },
          React.createElement(CommandItem, { value: 'build' }, 'Build UI', React.createElement(CommandShortcut, null, 'B')),
          React.createElement(CommandSeparator),
          React.createElement(CommandItem, { value: 'lint' }, 'Lint Repo')
        )
      )
    )
  );
  assert.match(ssrHtml, /data-slot="command"/u);
  assert.match(ssrHtml, /data-slot="command-input"/u);
  assert.match(ssrHtml, /data-slot="command-shortcut"[^>]*>B</u);
  assert.match(ssrHtml, /data-slot="command-separator"/u);

  await withDom(async ({ dom, root, doc }) => {
    const {
      CommandDialog,
      CommandInput,
      CommandList,
      CommandEmpty,
      CommandItem,
    } = await import('../dist/components/command.js');
    const selected = [];
    await React.act(async () => {
      root.render(
        React.createElement(
          CommandDialog,
          { open: true, title: 'Palette', description: 'Run action' },
          React.createElement(CommandInput, { placeholder: 'Type command' }),
          React.createElement(
            CommandList,
            null,
            React.createElement(CommandEmpty, null, 'Empty'),
            React.createElement(CommandItem, { value: 'deploy', onSelect: (v) => selected.push(v) }, 'Deploy')
          )
        )
      );
    });
    const dialog = globalThis.document.body.querySelector('[role="dialog"]');
    const item = globalThis.document.body.querySelector('[data-slot="command-item"]');
    assert.ok(dialog && item);
    await React.act(async () => {
      item.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
    assert.deepEqual(selected, ['deploy']);
  });
});

test('Sheet opens via trigger, exposes side attribute, and closes via SheetClose', async () => {
  await withDom(async ({ dom, root, doc }) => {
  const {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } = await import('../dist/index.js');
    await React.act(async () => {
      root.render(
        React.createElement(
          Sheet,
          null,
          React.createElement(SheetTrigger, null, 'Open Drawer'),
          React.createElement(
            SheetContent,
            { side: 'left' },
            React.createElement(
              SheetHeader,
              null,
              React.createElement(SheetTitle, null, 'Inspector'),
              React.createElement(SheetDescription, null, 'Token overrides')
            ),
            React.createElement(SheetFooter, null, React.createElement(SheetClose, null, 'Done'))
          )
        )
      );
    });
    assert.equal(globalThis.document.body.querySelector('[data-slot="sheet-content"]'), null);
    await React.act(async () => {
      findButtonByText(doc, 'Open Drawer')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
    const content = globalThis.document.body.querySelector('[data-slot="sheet-content"]');
    assert.ok(content);
    assert.equal(content.getAttribute('data-side'), 'left');
    assert.match(content.textContent, /Inspector.*Token overrides/u);
    await React.act(async () => {
      findButtonByText(content, 'Done')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
    assert.equal(globalThis.document.body.querySelector('[data-slot="sheet-content"]'), null);
  });
});

test('Accordion and RadioGroup toggle expanded and selected states interactively', async () => {
  await withDom(async ({ dom, root, doc }) => {
  const { Accordion, AccordionContent, AccordionItem, AccordionTrigger, RadioGroup, RadioGroupItem } =
    await import('../dist/index.js');
    const picked = [];
    await React.act(async () => {
      root.render(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(
            Accordion,
            { type: 'single', collapsible: true, defaultValue: 'one' },
            React.createElement(
              AccordionItem,
              { value: 'one' },
              React.createElement(AccordionTrigger, null, 'Section 1'),
              React.createElement(AccordionContent, null, 'Detail 1')
            ),
            React.createElement(
              AccordionItem,
              { value: 'two' },
              React.createElement(AccordionTrigger, null, 'Section 2'),
              React.createElement(AccordionContent, null, 'Detail 2')
            )
          ),
          React.createElement(
            RadioGroup,
            { defaultValue: 'alpha', onValueChange: (v) => picked.push(v), 'aria-label': 'Mode' },
            React.createElement(RadioGroupItem, { value: 'alpha', 'aria-label': 'Alpha' }),
            React.createElement(RadioGroupItem, { value: 'beta', 'aria-label': 'Beta' })
          )
        )
      );
    });
    const trigger1 = findButtonByText(doc, 'Section 1');
    const trigger2 = findButtonByText(doc, 'Section 2');
    assert.equal(trigger1?.getAttribute('aria-expanded'), 'true');
    assert.equal(trigger2?.getAttribute('aria-expanded'), 'false');
    await React.act(async () => {
      trigger2?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
    assert.equal(trigger1?.getAttribute('aria-expanded'), 'false');
    assert.equal(trigger2?.getAttribute('aria-expanded'), 'true');

    const betaRadio = doc.querySelector('[role="radio"][aria-label="Beta"]');
    assert.equal(betaRadio?.getAttribute('data-state'), 'unchecked');
    await React.act(async () => {
      betaRadio?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    });
    assert.equal(betaRadio?.getAttribute('data-state'), 'checked');
    assert.deepEqual(picked, ['beta']);
  });
});

test('CopyButton writes clipboard text, updates copied state, and resets after timeout', async () => {
  await withDom(async ({ dom, root, doc }) => {
  const { CopyButton } = await import('../dist/index.js');
    const writes = [];
    const callbacks = [];
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text) => { writes.push(text); } },
    });
    await React.act(async () => {
      root.render(
        React.createElement(CopyButton, {
          value: () => 'bun run test',
          label: 'Copy cmd',
          copiedLabel: 'Copied cmd',
          timeoutMs: 25,
          onCopied: (v) => callbacks.push(v),
        })
      );
    });
    const btn = doc.querySelector('[data-slot="copy-button"]');
    assert.ok(btn);
    assert.equal(btn.getAttribute('data-copied'), 'false');
    assert.match(btn.textContent, /Copy cmd/u);
    await React.act(async () => {
      btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });
    assert.deepEqual(writes, ['bun run test']);
    assert.deepEqual(callbacks, ['bun run test']);
    assert.equal(btn.getAttribute('data-copied'), 'true');
    assert.match(btn.textContent, /Copied cmd/u);
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 45));
    });
    assert.equal(btn.getAttribute('data-copied'), 'false');
    assert.match(btn.textContent, /Copy cmd/u);
  });
});
