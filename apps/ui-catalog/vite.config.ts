import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const appDirectory = path.dirname(fileURLToPath(import.meta.url));
const assetsDirectory = path.resolve(appDirectory, '../../packages/assets');
const ASSET_PREFIXES = [
  '/brand/',
  '/illustrations/',
  '/animation/',
  '/environments/',
  '/materials/',
  '/scenes/',
  '/sounds/',
];

const MIME_TYPES: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.wav': 'audio/wav',
};

const serveWorkspaceAssetsPlugin: PluginOption = {
  name: 'serve-workspace-assets',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const urlPath = req.url?.split('?')[0];
      if (!urlPath || !ASSET_PREFIXES.some((prefix) => urlPath.startsWith(prefix))) {
        next();
        return;
      }
      const relativePath = decodeURIComponent(urlPath.slice(1));
      const fullPath = path.resolve(assetsDirectory, relativePath);
      if (!fullPath.startsWith(assetsDirectory + path.sep) || !fs.existsSync(fullPath)) {
        next();
        return;
      }
      const ext = path.extname(fullPath).toLowerCase();
      if (MIME_TYPES[ext]) {
        res.setHeader('Content-Type', MIME_TYPES[ext]);
      }
      fs.createReadStream(fullPath).pipe(res);
    });
  },
};

const plugins: PluginOption[] = [
  react() as unknown as PluginOption,
  tailwindcss() as unknown as PluginOption,
  serveWorkspaceAssetsPlugin,
];

export default defineConfig({
  base: process.env.MW_UI_CATALOG_BASE_PATH ?? '/',
  plugins,
  root: appDirectory,
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    manifest: true,
  },
});
