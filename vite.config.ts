import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
