import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const appDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: appDirectory,
  plugins: [react()],
  test: {
    name: 'ui-catalog',
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./tests/vitest.setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/**/*.spec.ts', 'node_modules/**', 'dist/**'],
  },
});
