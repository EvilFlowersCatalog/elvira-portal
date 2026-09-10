# Welcome to Elvira Portal! 📘 🏖

The web frontend for the **[EvilFlowers Catalog](https://github.com/EvilFlowersCatalog/EvilFlowersCatalog)** —
a digital academic library. Browse and search the catalog, borrow and read
DRM-protected (Readium LCP) titles, manage loans and reservation queues, and
chat with the built-in AI assistant.

Crafted with **React 19 + Vite** and **TypeScript**. Sit back and relax — the app
hot-reloads whenever you tweak any source file.

## Highlights

- **Discovery** — keyword search, filters (feeds, categories, authors, language,
  year), suggestions, and infinite-scroll catalog browsing.
- **Lending** — borrow / renew / return flows and reservation queues with proper
  availability indicators (available · borrowed · reserved · unavailable).
- **Reading** — in-app reader (`@evilflowers/evilflowersviewer`) with annotations.
- **AI assistant** — conversational search & recommendations.
- **Multi-faculty theming** — per-catalog brand colors and logos (see below), plus
  a **light / dark mode** toggle.
- **Bilingual** — Slovak 🇸🇰 / English 🇬🇧 (`react-i18next`).
- **Accessible** — keyboard-operable controls with visible focus rings, dialog
  focus-traps, labeled inputs & icon buttons, `<html lang>` synced to the UI
  language, and WCAG-AA color contrast across every theme (light and dark).

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS (`darkMode: 'class'`) · react-router-dom v7 · @tanstack/react-query · react-i18next · axios

## Architecture & conventions

- **Path alias** — import from `@/…` (maps to `src/…`) instead of deep `../../../`
  relative paths. Configured in `vite.config.ts` and `tsconfig.json`.
- **Code-splitting** — every route is lazily loaded (`React.lazy` in
  `src/routes/BaseRoutes.tsx`) behind a `<Suspense>` boundary in `App.tsx`, and
  heavy vendors (the reader, markdown, i18n) are split into their own chunks
  via `build.rollupOptions.output.manualChunks`. The initial payload no longer
  ships the whole app.
- **Data fetching** — new read endpoints use **React Query**
  (`src/lib/reactQuery.ts` + `QueryClientProvider` in `main.tsx`). See
  `src/hooks/api/catalogs/useCatalogsQuery.ts` for the reference pattern: wrap a
  `useAxios()` call in `useQuery` with a stable `queryKey`. The older imperative
  `hooks/api/**` hooks (which return a bare async fetch function) are being
  migrated onto this pattern incrementally — both styles coexist.
- **Linting** — ESLint 9 flat config (`eslint.config.js`) with
  `react-hooks/rules-of-hooks` enforced. Prettier config in `.prettierrc.json`.

## Local development

```bash
npm install
npm run dev
```

Then glide over to `http://localhost:3000/` to explore. The dev server reads
`env/.env.development`.

### Available scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server (`http://localhost:3000/`) |
| `npm run build:dev` | Type-check + build in **development** mode (`env/.env.development`) |
| `npm run build:prod` | Type-check + build in **production** mode (`env/.env.production`) |
| `npm run build:stu` | Type-check + build in **stu** mode (`env/.env.stu`) |
| `npm run preview` | Serve the last build locally |
| `npm run typecheck` | Type-check without emitting (`tsc --noEmit`) |
| `npm run lint` | ESLint 9 (flat config) over `src` |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm run format` | Prettier write over `src` |

> There is intentionally **no** `npm run start`. Use `npm run dev`.

## Build process

Run `npm run build:<mode>` — the mode selects which `env/.env.<mode>` file shapes
the build. Then `npm run preview` to serve it.

## Faculty themes

The active theme is chosen per catalog / via `ELVIRA_THEME` and drives the brand
palette and logos (light & dark). Supported `data-theme` values:

`fiit` · `stu` · `mtf` · `svf` · `sjf` · `fei` · `fchpt` · `fad` · `ku` (Katolícka
univerzita Ružomberok) · `default`

Each theme exposes contrast-aware CSS variables in `src/main.css`
(`--color-primary`, `--color-primary-text`, `--color-on-primary`,
`--color-primary-dark`, …) so text and buttons meet WCAG AA on every palette.

## Environment variables

Elvira-specific variables:

- **`ELVIRA_BASE_URL`** — API base URL the frontend fetches all data from.
- **`ELVIRA_CATALOG_ID`** — the catalog whose data is shown. Each catalog maps to a
  faculty/department with its own theme and content.
- **`ELVIRA_THEME`** — faculty theme name (see the list above); selects logos and colors.
- **`ELVIRA_ASSISTANT_URL`** — base URL of the AI assistant service (chat & recommendations).
- **`ELVIRA_UMAMI_SERVER`** — analytics (Umami) server URL.
- **`ELVIRA_UMAMI_WEBSITE`** — Umami website ID for analytics.
- **`ELVIRA_EXPERIMENTAL_FEATURES`** — `true`/`false`; gates undeveloped features when
  shipping a dev build to production.

Prefer overriding these via bash rather than editing the `env/.env.*` files directly:

```bash
export ELVIRA_BASE_URL=base_url
export ELVIRA_CATALOG_ID=catalog_id
export ELVIRA_THEME=theme
export ELVIRA_ASSISTANT_URL=assistant_url
export ELVIRA_UMAMI_SERVER=server_url
export ELVIRA_UMAMI_WEBSITE=website_id
export ELVIRA_EXPERIMENTAL_FEATURES=false

npm run build:prod
```

🔔 **Gentle reminder** 🔔 — clean up afterward:

```bash
unset ELVIRA_BASE_URL ELVIRA_CATALOG_ID ELVIRA_THEME ELVIRA_ASSISTANT_URL \
      ELVIRA_UMAMI_SERVER ELVIRA_UMAMI_WEBSITE ELVIRA_EXPERIMENTAL_FEATURES
```

Let the adventure begin! 🚀
