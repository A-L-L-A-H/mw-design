import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const basePath = '/moonwitness-xiv/components/';
const baseURL = 'http://127.0.0.1:4194/moonwitness-xiv/components/';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 1,
  reporter: [['list']],
  outputDir: '../../test-results/ui-catalog-exp',
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
  use: {
    baseURL,
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: `bunx vite preview --host 127.0.0.1 --port 4194 --strictPort --base ${basePath}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
