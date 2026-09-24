import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite is configured for a Tauri renderer, not a website.
 *
 * Port 1420 is fixed and `strictPort` is on because `tauri.conf.json` and the
 * API's `ADMIN_ORIGIN` both name that exact origin — silently moving to 1421
 * would break CORS in a way that looks like an auth bug.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 1420, strictPort: true },
  build: {
    // Tauri ships a modern WebView on every supported platform, so there is no
    // reason to down-level the output for legacy browsers.
    target: 'es2022',
    sourcemap: false,
    // Vite's 500 kB warning is about network transfer. This bundle is read from
    // local disk inside the app package — it is never downloaded — so splitting
    // it would add complexity and buy nothing. The limit is raised rather than
    // silenced entirely, so a genuinely runaway bundle still surfaces.
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
