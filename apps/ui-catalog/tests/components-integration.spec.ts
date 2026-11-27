import { expect, test } from '@playwright/test';

test.describe('UI catalog key component integration', () => {
  test('switches between light, dark, and high-contrast themes smoothly', async ({ page }) => {
    await page.goto('./');

    const root = page.locator('html');
    await expect(root).toHaveAttribute('data-theme', 'light');

    const themeGroup = page.getByRole('group', { name: 'Color theme' });
    await themeGroup.getByRole('button', { name: 'Use dark theme', exact: true }).click();
    await expect(root).toHaveAttribute('data-theme', 'dark');
    await expect(root).toHaveClass(/\bdark\b/);

    await themeGroup.getByRole('button', { name: 'Use high contrast theme', exact: true }).click();
    await expect(root).toHaveAttribute('data-theme', 'high-contrast');
    await expect(root).toHaveClass(/\bhigh-contrast\b/);

    await themeGroup.getByRole('button', { name: 'Use light theme', exact: true }).click();
    await expect(root).toHaveAttribute('data-theme', 'light');
  });

  test('focuses sidebar search via Ctrl+K and filters sections by component name', async ({
    page,
  }) => {
    await page.goto('./');

    const searchInput = page.getByTestId('sidebar-component-search');
    const nav = page.getByRole('navigation', { name: 'Component sections' });
    const initialCount = await nav.getByRole('link').count();
    expect(initialCount).toBeGreaterThan(5);

    await page.keyboard.press('Control+k');
    await expect(searchInput).toBeFocused();

    await searchInput.fill('Accordion');
    const filteredLinks = nav.getByRole('link');
    await expect(filteredLinks).toHaveCount(1);
    await expect(filteredLinks.first()).toContainText('Core primitives');

    await page.getByRole('button', { name: 'Clear component filter' }).click();
    await expect(searchInput).toHaveValue('');
    await expect(nav.getByRole('link')).toHaveCount(initialCount);
  });

  test('interactive ComponentPlayground updates live preview and generated JSX in real time', async ({
    page,
  }) => {
    await page.goto('./#playground');

    const playground = page.getByTestId('component-playground');
    const preview = playground.getByTestId('playground-preview');
    const jsxOutput = playground.getByTestId('playground-jsx-output');

    await playground.getByRole('button', { name: 'magenta', exact: true }).click();
    await expect(preview.locator('.mw-ui-button')).toHaveAttribute('data-variant', 'magenta');
    await expect(jsxOutput).toContainText('variant="magenta"');

    await playground.getByLabel('Loading state').check();
    await expect(preview.locator('.mw-ui-button')).toBeDisabled();
    await expect(preview.locator('.mw-ui-button')).toHaveAttribute('aria-busy', 'true');
    await expect(jsxOutput).toContainText('loading');

    await playground.getByRole('button', { name: 'Alert', exact: true }).click();
    await playground.getByRole('button', { name: 'success', exact: true }).click();
    await expect(preview.locator('.mw-ui-alert')).toHaveAttribute('data-variant', 'success');

    await playground.getByRole('button', { name: 'Progress', exact: true }).click();
    await expect(preview.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '68');

    const borderGroup = playground.getByRole('group', { name: 'Border style' });
    const shadowGroup = playground.getByRole('group', { name: 'Shadow density' });
    await borderGroup.getByRole('button', { name: 'heavy', exact: true }).click();
    await shadowGroup.getByRole('button', { name: 'bold', exact: true }).click();
    await expect(preview).toHaveAttribute('data-border-style', 'heavy');
    await expect(preview).toHaveAttribute('data-shadow-density', 'bold');
    await expect(jsxOutput).toContainText('border-style: heavy');
    await expect(jsxOutput).toContainText('shadow-density: bold');

    const frameWidth = await preview.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--mw-frame-width').trim()
    );
    expect(frameWidth).toBe('3px');

    const a11yPanel = playground.getByTestId('playground-a11y-panel');
    await expect(a11yPanel).toBeVisible();
    await expect(a11yPanel.getByTestId('a11y-aria-section')).toContainText('Signal upload');
    await expect(a11yPanel.getByTestId('a11y-contrast-section')).toContainText(':1');

    // Switch back to Button and verify interactive focus stop focuses the preview button
    await playground.getByRole('button', { name: 'Button', exact: true }).click();
    await playground.getByLabel('Loading state').uncheck();
    const focusStop = a11yPanel.getByTestId('a11y-focus-section').getByRole('button', { name: /#1/ });
    await expect(focusStop).toContainText('Launch action');
    await focusStop.click();
    await expect(preview.locator('.mw-ui-button')).toBeFocused();
  });

  test('Core primitives showcase supports Alert, Progress, Accordion, RadioGroup, and Copy CSS', async ({
    page,
  }) => {
    await page.goto('./#core-primitives');

    const section = page.locator('#core-primitives');
    await expect(section).toBeVisible();

    // Dismiss and restore destructive Alert
    const alert = section.locator('.mw-ui-alert[data-variant="destructive"]');
    await expect(alert).toBeVisible();
    await alert.getByRole('button', { name: 'Dismiss alert' }).click();
    await expect(alert).toBeHidden();
    await section.getByRole('button', { name: 'Restore dismissible alert' }).click();
    await expect(section.locator('.mw-ui-alert[data-variant="destructive"]')).toBeVisible();

    // Advance Progress bar
    const progressbar = section.getByRole('progressbar', { name: 'Issue build pipeline' });
    await expect(progressbar).toHaveAttribute('aria-valuenow', '64');
    await section.getByRole('button', { name: 'Advance progress' }).click();
    await expect(progressbar).toHaveAttribute('aria-valuenow', '82');

    // Expand Accordion item
    const trigger = section.getByRole('button', { name: 'Works without Tailwind CSS?' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Change RadioGroup option
    await section.getByText('Field reporters').click();
    await expect(section.getByText('Dispatch channel (field)')).toBeVisible();

    // Per-example Copy CSS button
    const copyCssButton = section.getByTestId('copy-example-styles').first();
    await copyCssButton.click();
    await expect(copyCssButton).toHaveAttribute('data-copied', 'true');
  });

  test('exports active design system tokens as downloadable CSS and JSON files', async ({
    page,
  }) => {
    await page.goto('./');

    // Switch to Dark mode so active colors reflect dark theme overrides
    const themeGroup = page.getByRole('group', { name: 'Color theme' });
    await themeGroup.getByRole('button', { name: 'Use dark theme', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const exportPanel = page.getByTestId('token-export-panel');
    await exportPanel.scrollIntoViewIfNeeded();
    await expect(exportPanel).toBeVisible();

    const preview = exportPanel.getByTestId('token-export-preview');
    await expect(preview).toContainText('theme: dark');
    await expect(preview).toContainText('--mw-background:');
    await expect(preview).toContainText('--mw-space-4:');
    await expect(preview).toContainText('--mw-font-sans:');

    // Switch preview to JSON and verify valid JSON payload
    await exportPanel.getByRole('button', { name: 'JSON Object', exact: true }).click();
    const jsonText = (await preview.textContent()) ?? '';
    const parsed = JSON.parse(jsonText) as {
      meta: { theme: string };
      colors: Record<string, string>;
      spacing: Record<string, string>;
      typography: Record<string, string>;
    };
    expect(parsed.meta.theme).toBe('dark');
    expect(parsed.colors['--mw-background']).toBeTruthy();
    expect(parsed.spacing['--mw-space-4']).toBeTruthy();
    expect(parsed.typography['--mw-font-mono']).toBeTruthy();

    // Verify real downloadable CSS and JSON files
    const [cssDownload] = await Promise.all([
      page.waitForEvent('download'),
      exportPanel.getByRole('button', { name: 'Download CSS', exact: true }).click(),
    ]);
    expect(cssDownload.suggestedFilename()).toMatch(/^moonwitness-tokens-.*-dark-.*\.css$/);

    const [jsonDownload] = await Promise.all([
      page.waitForEvent('download'),
      exportPanel.getByRole('button', { name: 'Download JSON', exact: true }).click(),
    ]);
    expect(jsonDownload.suggestedFilename()).toMatch(/^moonwitness-tokens-.*-dark-.*\.json$/);
  });

  test('tracks Most Viewed sections in localStorage, persists across reloads, and clears cleanly', async ({
    page,
  }) => {
    await page.goto('./');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    const mostViewed = page.getByTestId('sidebar-most-viewed');
    await expect(mostViewed).toHaveCount(0);

    const nav = page.getByRole('navigation', { name: 'Component sections' });
    await nav.getByRole('link', { name: 'Forms', exact: true }).click();
    await nav.getByRole('link', { name: 'Core primitives', exact: true }).click();
    await nav.getByRole('link', { name: 'Core primitives', exact: true }).click();

    await expect(mostViewed).toBeVisible();
    const rankedLinks = mostViewed.getByRole('link');
    await expect(rankedLinks).toHaveCount(2);
    await expect(rankedLinks.nth(0)).toContainText('Core primitives');
    await expect(rankedLinks.nth(0)).toContainText('2');
    await expect(rankedLinks.nth(1)).toContainText('Forms');
    await expect(rankedLinks.nth(1)).toContainText('1');

    // Reloading the catalog preserves Most Viewed state from localStorage
    await page.reload();
    await expect(mostViewed).toBeVisible();
    await expect(mostViewed.getByRole('link').nth(0)).toContainText('Core primitives');
    await expect(mostViewed.getByRole('link').nth(0)).toContainText('2');

    // Clearing history empties localStorage and hides the Most Viewed panel
    await mostViewed.getByRole('button', { name: 'Clear most viewed history' }).click();
    await expect(mostViewed).toHaveCount(0);

    await page.reload();
    await expect(mostViewed).toHaveCount(0);
  });

  test('topbar Grid Density toggle adjusts preview card padding, margin, and grid gap between comfortable and compact', async ({
    page,
  }) => {
    await page.goto('./');

    const root = page.locator('html');
    const densityGroup = page.getByTestId('grid-density-toggle');
    const comfortableBtn = densityGroup.getByRole('button', {
      name: 'Comfortable',
      exact: true,
    });
    const compactBtn = densityGroup.getByRole('button', {
      name: 'Compact',
      exact: true,
    });

    await expect(root).toHaveAttribute('data-density', 'comfortable');
    await expect(comfortableBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(compactBtn).toHaveAttribute('aria-pressed', 'false');

    const readCardMetrics = () =>
      page.evaluate(() => {
        const examples = document.querySelector<HTMLElement>('.catalog-examples');
        const card = document.querySelector<HTMLElement>('.catalog-example');
        const copy = document.querySelector<HTMLElement>('.catalog-example-copy');
        const stage = document.querySelector<HTMLElement>('.catalog-example-stage');
        const topbar = document.querySelector<HTMLElement>('.catalog-topbar');
        if (!examples || !card || !copy || !stage || !topbar) {
          throw new Error('Catalog card elements missing');
        }
        return {
          examplesGap: parseFloat(getComputedStyle(examples).rowGap),
          cardMarginTop: parseFloat(getComputedStyle(card).marginTop),
          copyPaddingTop: parseFloat(getComputedStyle(copy).paddingTop),
          stagePaddingTop: parseFloat(getComputedStyle(stage).paddingTop),
          topbarHeight: Math.round(topbar.getBoundingClientRect().height),
        };
      });

    const comfortableMetrics = await readCardMetrics();
    expect(comfortableMetrics.topbarHeight).toBe(68);
    expect(comfortableMetrics.cardMarginTop).toBeGreaterThan(0);

    await compactBtn.click();
    await expect(root).toHaveAttribute('data-density', 'compact');
    await expect(compactBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(comfortableBtn).toHaveAttribute('aria-pressed', 'false');

    await expect
      .poll(async () => (await readCardMetrics()).stagePaddingTop)
      .toBeLessThan(comfortableMetrics.stagePaddingTop);

    const compactMetrics = await readCardMetrics();
    expect(compactMetrics.examplesGap).toBeLessThan(comfortableMetrics.examplesGap);
    expect(compactMetrics.cardMarginTop).toBeLessThan(comfortableMetrics.cardMarginTop);
    expect(compactMetrics.copyPaddingTop).toBeLessThan(comfortableMetrics.copyPaddingTop);
    expect(compactMetrics.stagePaddingTop).toBeLessThan(comfortableMetrics.stagePaddingTop);

    // Token export panel automatically picks up compact density
    await expect(page.getByTestId('token-export-preview')).toContainText('density: compact');

    // Switch back to comfortable and confirm metrics restore
    await comfortableBtn.click();
    await expect(root).toHaveAttribute('data-density', 'comfortable');
    await expect
      .poll(async () => (await readCardMetrics()).stagePaddingTop)
      .toBe(comfortableMetrics.stagePaddingTop);
  });

  test('hydrates Playground from shareable URL params and filters Component API Reference', async ({
    page,
  }) => {
    await page.goto('./?pg=card&bs=heavy&sd=bold#playground');

    const playground = page.getByTestId('component-playground');
    const preview = playground.getByTestId('playground-preview');
    await expect(preview).toHaveAttribute('data-border-style', 'heavy');
    await expect(preview).toHaveAttribute('data-shadow-density', 'bold');
    await expect(playground.getByTestId('playground-jsx-output')).toContainText('<Card');

    const apiRef = page.getByTestId('component-api-reference');
    await apiRef.scrollIntoViewIfNeeded();
    await apiRef
      .getByRole('searchbox', { name: 'Filter component API reference' })
      .fill('ThemeProvider');
    await expect(apiRef).toContainText('createSkinInitScript');
  });
});



