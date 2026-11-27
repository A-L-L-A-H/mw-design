import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const flakeReporter = resolve(repositoryRoot, 'scripts/playwright-flake-reporter.mjs');
const ci = process.env.CI === 'true';

const basePath = process.env.MW_UI_CATALOG_BASE_PATH ?? '/';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:4174${basePath}`;

const reporters: ReporterDescription[] = [
  ['list'],
  ['junit', { outputFile: '../../test-results/junit/ui-catalog.xml' }],
];

if (existsSync(flakeReporter)) {
  reporters.push([
    flakeReporter,
    { outputFile: resolve(repositoryRoot, 'test-results/junit/ui-catalog-retries.json') },
  ]);
}

const defaultContainerShell =
  '/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell';
const chromiumExecutablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  (existsSync(defaultContainerShell) ? defaultContainerShell : undefined);

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: ci ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: reporters,
  outputDir: '../../test-results/ui-catalog',
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
  use: {
    baseURL,
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    ...(chromiumExecutablePath
      ? { launchOptions: { executablePath: chromiumExecutablePath } }
      : {}),
  },
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 4174 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
