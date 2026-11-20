/// <reference types="vite/client" />

/** package.json version, injected by vite.config.ts `define`. */
declare const __APP_VERSION__: string;
/** Short commit hash of the build (Faro `app.release`, elvira-portal#58), injected by vite.config.ts. */
declare const __GIT_SHA__: string;
/** The hosted pdf.js worker relative to the base (`assets/pdf.worker-<hash>.min.js`), or null; vite.config.ts. */
declare const __PDFJS_WORKER__: string | null;
