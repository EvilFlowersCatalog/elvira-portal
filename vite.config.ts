import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import react from '@vitejs/plugin-react';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/**
 * The build's short commit (Faro `app.release`, #58): GIT_SHA (the image build arg, #61), else
 * GITHUB_SHA (Actions), else the local checkout, else `local`.
 */
const gitSha = (() => {
  const fromEnv = process.env.GIT_SHA || process.env.GITHUB_SHA;
  if (fromEnv) return fromEnv.slice(0, 7);
  try {
    return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'local';
  }
})();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // service.version and app.release on browser telemetry (src/lib/telemetry.ts).
  define: { __APP_VERSION__: JSON.stringify(version), __GIT_SHA__: JSON.stringify(gitSha) },
  clearScreen: false,
  envPrefix: 'ELVIRA_',
  envDir: 'env',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    // esbuild's minifier hangs re-minifying the pre-minified evilflowersviewer bundle.
    minify: false,
    // Route-level code-splitting (React.lazy) keeps the main entry small; the
    // reader/viewer vendor chunk is legitimately large so raise the warning bar.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // rolldown (Vite's default bundler) only supports the function form of
        // manualChunks, not Rollup's legacy object/record form.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) return 'vendor-react';
            if (id.includes('@evilflowers/evilflowersviewer')) return 'vendor-viewer';
            if (/[\\/](react-i18next|i18next)[\\/]/.test(id)) return 'vendor-i18n';
            if (/[\\/](react-markdown|remark-gfm)[\\/]/.test(id)) return 'vendor-markdown';
          }
        },
      },
    },
  },
});
