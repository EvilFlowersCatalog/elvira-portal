import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { cpSync, existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import react from '@vitejs/plugin-react';

/**
 * The pdf.js resource folders the viewer loads at runtime (`pdfAssetsUrl`, elvira-portal#63): Wasm
 * decoders for JPX/JBIG2 scans, CMaps, standard fonts, ICC profiles. Served at /pdfjs/ in dev and
 * copied to dist/pdfjs/ on build, from the pdfjs-dist the installed viewer resolves (so the versions
 * always match, also when CI swaps in the viewer's `develop`).
 */
const PDFJS_FOLDERS = ['wasm', 'cmaps', 'standard_fonts', 'iccs'];
/** The pdf.js worker the viewer's own pdfjs-dist ships (`pdfWorkerUrl`, elvira-portal#64). */
const PDFJS_WORKER = join('legacy', 'build', 'pdf.worker.min.mjs');
const pdfjsAssets = (): Plugin => {
  let root = '';
  /** Null (with a warning) when it cannot be resolved: the viewer then decodes without the Wasm helpers. */
  const pdfjsRoot = (): string | null => {
    try {
      const require = createRequire(import.meta.url);
      const viewer = dirname(require.resolve('@evilflowers/evilflowersviewer/package.json'));
      return dirname(createRequire(join(viewer, 'package.json')).resolve('pdfjs-dist/package.json'));
    } catch (error) {
      console.warn(`[pdfjs-assets] pdfjs-dist not found, /pdfjs/ stays empty: ${(error as Error).message}`);
      return null;
    }
  };
  /**
   * Where the worker is served, relative to the base: `assets/pdf.worker-<content hash>.min.js`. Under
   * `assets/` with a content hash, so the deployments' nginx rule for `/assets/` (immutable, IP-027) caches
   * it for good and a viewer upgrade gets a new name. `.js`, not `.mjs`: a module worker needs a JavaScript
   * MIME type and nginx's stock mime.types may not map `.mjs`. Null without pdfjs-dist: the viewer then
   * loads its bundled copy.
   */
  const workerFile = (() => {
    const base = pdfjsRoot();
    const source = base && join(base, PDFJS_WORKER);
    if (!source || !existsSync(source)) return null;
    const hash = createHash('sha256').update(readFileSync(source)).digest('hex').slice(0, 10);
    return { source, path: `assets/pdf.worker-${hash}.min.js` };
  })();
  return {
    name: 'pdfjs-assets',
    config: () => ({ define: { __PDFJS_WORKER__: JSON.stringify(workerFile?.path ?? null) } }),
    configResolved(resolved) {
      root = resolve(resolved.root, resolved.build.outDir);
    },
    configureServer(server) {
      const base = pdfjsRoot();
      if (!base) return;
      if (workerFile) {
        server.middlewares.use(`/${workerFile.path}`, (_req, res) => {
          res.setHeader('Content-Type', 'text/javascript');
          res.end(readFileSync(workerFile.source));
        });
      }
      server.middlewares.use('/pdfjs', (req, res, next) => {
        const path = normalize(decodeURIComponent((req.url ?? '').split('?')[0])).replace(/^([/\\])+/, '');
        const file = join(base, path);
        if (!PDFJS_FOLDERS.includes(path.split(/[/\\]/)[0]) || !file.startsWith(base + sep)) return next();
        if (!existsSync(file) || !statSync(file).isFile()) return next();
        if (file.endsWith('.wasm')) res.setHeader('Content-Type', 'application/wasm');
        res.end(readFileSync(file));
      });
    },
    closeBundle() {
      const base = pdfjsRoot();
      if (!base) return;
      for (const folder of PDFJS_FOLDERS) {
        const from = join(base, folder);
        if (existsSync(from)) cpSync(from, join(root, 'pdfjs', folder), { recursive: true });
      }
      if (workerFile) cpSync(workerFile.source, join(root, workerFile.path));
    },
  };
};

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
  plugins: [react(), pdfjsAssets()],
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
            // The viewer's entry only: its own lazy chunks (`dist/chunks/`: the bundled pdf.js worker, the
            // renderer worker, print, QR, ink) stay lazy. Pulled in here, the ~1.7 MB bundled worker would
            // be downloaded on every read even with `pdfWorkerUrl` (#64).
            if (id.includes('@evilflowers/evilflowersviewer') && !/[\\/]dist[\\/]chunks[\\/]/.test(id)) return 'vendor-viewer';
            if (/[\\/](react-i18next|i18next)[\\/]/.test(id)) return 'vendor-i18n';
            if (/[\\/](react-markdown|remark-gfm)[\\/]/.test(id)) return 'vendor-markdown';
          }
        },
      },
    },
  },
});
