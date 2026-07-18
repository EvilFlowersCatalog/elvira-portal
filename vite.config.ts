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
    // Route-level code-splitting (React.lazy) keeps the main entry small; the
    // reader/viewer vendor chunk is legitimately large so raise the warning bar.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy, independently-cacheable vendor groups out of the main bundle.
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-viewer': ['@evilflowers/evilflowersviewer'],
          'vendor-i18n': ['react-i18next', 'i18next'],
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
});
