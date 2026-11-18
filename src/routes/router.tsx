import { ComponentType } from 'react';
import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
import App from '../App';
import { NAVIGATION_PATHS } from '../utils/interfaces/general/general';
import RequireAuth from './guards/AuthGuard';
import RequireAdmin from './guards/AdminGuard';
import { AdminLayout } from '../components/admin';
import RequireFeature from './guards/FeatureGuard';
import RouteError from '../components/page/RouteError';
import PageLoading from '../components/page/PageLoading';
import { LoginRoute, RootLayout } from './RootLayout';
import { citeLoader, entryLoader, legacyViewerLoader, readerLoader, readerShouldRevalidate } from './loaders';
import { loadEntryPage } from './pages';
import ReaderShell from './ReaderShell';

/**
 * The portal's routes as a data router (createBrowserRouter). Compared with the `<Routes>` tree before:
 *
 * - **Route-level code splitting through `lazy`.** The router fetches a page's chunk *before* it commits
 *   the navigation, so the current page stays on screen (with the progress bar, App) instead of flashing to a
 *   Suspense fallback, and a loader's data request runs in parallel with the chunk download.
 * - **Loaders** start a page's data with its chunk (the publication page) or decide where a link really goes
 *   before anything renders (the reader: which file, or the publication page when it can't be read here;
 *   the old `/viewer/…` and `/cite/…` addresses).
 * - **`errorElement`** turns a failed loader into a message inside the app chrome, not a blank screen.
 *
 * Every address is documented in docs/semantic-urls.md and built by src/lib/links.
 */

/** A lazily loaded page (its module's default export). */
const page =
  (load: () => Promise<{ default: ComponentType }>) =>
  async (): Promise<Pick<RouteObject, 'Component'>> => ({ Component: (await load()).default });

const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      {
        element: <App />,
        children: [
          {
            // Loader failures render here, inside the navigation chrome.
            errorElement: <RouteError />,
            // A cold start: the navigation paints while the first page's chunk (and loader) finish.
            hydrateFallbackElement: <PageLoading />,
            children: [
              { path: '404', lazy: page(() => import('../pages/common/NotFound')) },
              {
                path: 'login',
                lazy: async () => {
                  const { default: Auth } = await import('../pages/auth/Auth');
                  return { Component: () => <LoginRoute Auth={Auth} /> };
                },
              },
              { path: '*', element: <Navigate to={NAVIGATION_PATHS.notFound} replace /> },

              // Help: public, reachable without login. Features switched off answer 404 (Administration › Features).
              {
                element: <RequireFeature feature="help" />,
                children: [
                  { path: 'help', lazy: page(() => import('../pages/common/help/Help')) },
                  { path: 'help/books', lazy: page(() => import('../pages/common/help/HelpBooks')) },
                  { path: 'help/search', lazy: page(() => import('../pages/common/help/HelpSearch')) },
                  {
                    element: <RequireFeature feature="lending" />,
                    children: [{ path: 'help/loans', lazy: page(() => import('../pages/common/help/HelpLoans')) }],
                  },
                  { path: 'help/viewer', lazy: page(() => import('../pages/common/help/HelpViewer')) },
                  {
                    element: <RequireFeature feature="assistant" />,
                    children: [{ path: 'help/ai', lazy: page(() => import('../pages/common/help/HelpAi')) }],
                  },
                  { path: 'help/profile', lazy: page(() => import('../pages/common/help/HelpProfile')) },
                  { path: 'help/readers', lazy: page(() => import('../pages/common/help/HelpReaders')) },
                ],
              },

              // Signed in only.
              {
                element: <RequireAuth />,
                children: [
                  { index: true, lazy: page(() => import('../pages/common/Home')) },
                  { path: 'library', lazy: page(() => import('../pages/common/Library')) },
                  {
                    path: 'library/reservations/:reservation-id/claim',
                    lazy: page(() => import('../pages/common/ClaimReservation')),
                  },
                  { path: 'shelf', lazy: page(() => import('../pages/common/Shelf')) },
                  { path: 'profile', lazy: page(() => import('../pages/common/Profile')) },
                  { path: 'history', lazy: page(() => import('../pages/common/History')) },
                  {
                    element: <RequireFeature feature="graph" />,
                    children: [{ path: 'explore', lazy: page(() => import('../pages/common/Explore')) }],
                  },
                  {
                    element: <RequireFeature feature="lending" />,
                    children: [{ path: 'loans', lazy: page(() => import('../pages/common/Loans')) }],
                  },
                  { path: 'feeds', lazy: page(() => import('../pages/common/Feeds')) },
                  { path: 'categories', lazy: page(() => import('../pages/common/Categories')) },
                  {
                    element: <RequireFeature feature="assistant" />,
                    children: [
                      { path: 'ai-assistant', lazy: page(() => import('../pages/common/AiAssistant')) },
                      { path: 'ai-chat-history', lazy: page(() => import('../pages/common/AiChatHistory')) },
                    ],
                  },

                  // A publication: its page, a tab of it, and the reader (docs/semantic-urls.md §4).
                  {
                    path: 'entries/:entryId/read',
                    loader: readerLoader,
                    shouldRevalidate: readerShouldRevalidate,
                    Component: ReaderShell,
                  },
                  { path: 'entries/:entryId', loader: entryLoader, lazy: page(loadEntryPage) },
                  { path: 'entries/:entryId/:tab', loader: entryLoader, lazy: page(loadEntryPage) },

                  // Addresses kept for links already out there.
                  // Loader-only: they always redirect, so they render nothing of their own.
                  { path: 'viewer/:entry-id/:index', loader: legacyViewerLoader, element: null },
                  // Durable citation links (#46): the catalog, chats and agents hand these out.
                  { path: 'cite/:entryId/:key', loader: citeLoader, element: null },

                  // Administration.
                  {
                    path: 'administration',
                    element: <RequireAdmin />,
                    children: [
                      {
                        element: <AdminLayout />,
                        children: [
                          { index: true, lazy: page(() => import('../pages/admin/AdminHome')) },
                          {
                            path: 'entries',
                            children: [
                              { index: true, lazy: page(() => import('../pages/admin/entries/AdminEntries')) },
                              { path: 'add', lazy: page(() => import('../pages/admin/entries/AdminAddEntry')) },
                              { path: 'edit/:entry-id', lazy: page(() => import('../pages/admin/entries/AdminEditEntry')) },
                            ],
                          },
                          { path: 'feeds', lazy: page(() => import('../pages/admin/AdminFeeds')) },
                          { path: 'categories', lazy: page(() => import('../pages/admin/AdminCategories')) },
                          { path: 'catalogs', lazy: page(() => import('../pages/admin/AdminCatalogs')) },
                          { path: 'authors', lazy: page(() => import('../pages/admin/AdminAuthors')) },
                          { path: 'reviews', lazy: page(() => import('../pages/admin/AdminReviews')) },
                          { path: 'access', lazy: page(() => import('../pages/admin/AdminAccess')) },
                          {
                            path: 'users',
                            children: [
                              { index: true, lazy: page(() => import('../pages/admin/AdminUsers')) },
                              { path: ':user-id', lazy: page(() => import('../pages/admin/AdminUserProfile')) },
                            ],
                          },
                          // The separate AI users page is gone; keep old links working.
                          { path: 'ai-users', element: <Navigate to={NAVIGATION_PATHS.adminUsers} replace /> },
                          { path: 'loans', lazy: page(() => import('../pages/admin/AdminLoans')) },
                          { path: 'jobs', lazy: page(() => import('../pages/admin/AdminJobs')) },
                          // Always reachable: it is where switched-off features are switched back on.
                          { path: 'features', lazy: page(() => import('../pages/admin/AdminFeatures')) },
                          {
                            element: <RequireFeature feature="instanceSettings" />,
                            children: [{ path: 'settings', lazy: page(() => import('../pages/admin/AdminSettings')) }],
                          },
                          {
                            element: <RequireFeature feature="contentPolicies" />,
                            children: [
                              { path: 'content-policies', lazy: page(() => import('../pages/admin/AdminContentPolicies')) },
                            ],
                          },
                          // IP-034 (#51, #53): harvest sources, their detail, and the sync-conflicts inbox.
                          {
                            element: <RequireFeature feature="interop" />,
                            children: [
                              {
                                path: 'harvest',
                                children: [
                                  { index: true, lazy: page(() => import('../pages/admin/harvest/AdminHarvest')) },
                                  { path: 'conflicts', lazy: page(() => import('../pages/admin/harvest/AdminHarvestConflicts')) },
                                  { path: ':source-id', lazy: page(() => import('../pages/admin/harvest/AdminHarvestSource')) },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
