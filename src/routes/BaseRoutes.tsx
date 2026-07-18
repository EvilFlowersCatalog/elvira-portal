import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import App from '../App';
import { NAVIGATION_PATHS } from '../utils/interfaces/general/general';
import RequireAuth from './guards/AuthGuard';
import useAuthContext from '../hooks/contexts/useAuthContext';
import RequireAdmin from './guards/AdminGuard';
import CatalogInitializer from '../components/catalog/CatalogInitializer';
import { AdminLayout } from '../components/admin';

// Route-level code-splitting: each page becomes its own lazily-loaded chunk so
// the initial bundle no longer ships the entire app (viewer, admin, AI, help…).
const Library = lazy(() => import('../pages/common/Library'));
const Shelf = lazy(() => import('../pages/common/Shelf'));
const NotFound = lazy(() => import('../pages/common/NotFound'));
const Viewer = lazy(() => import('../pages/common/Viewer'));
const Home = lazy(() => import('../pages/common/Home'));
const Feeds = lazy(() => import('../pages/common/Feeds'));
const Auth = lazy(() => import('../pages/auth/Auth'));
const Loans = lazy(() => import('../pages/common/Loans'));
const Profile = lazy(() => import('../pages/common/Profile'));
const History = lazy(() => import('../pages/common/History'));
const ClaimReservation = lazy(() => import('../pages/common/ClaimReservation'));
const AiAssistantPage = lazy(() => import('../pages/common/AiAssistant'));
const AiChatHistory = lazy(() => import('../pages/common/AiChatHistory'));

const Help = lazy(() => import('../pages/common/help/Help'));
const HelpLoans = lazy(() => import('../pages/common/help/HelpLoans'));
const HelpBooks = lazy(() => import('../pages/common/help/HelpBooks'));
const HelpSearch = lazy(() => import('../pages/common/help/HelpSearch'));
const HelpViewer = lazy(() => import('../pages/common/help/HelpViewer'));
const HelpAi = lazy(() => import('../pages/common/help/HelpAi'));
const HelpProfile = lazy(() => import('../pages/common/help/HelpProfile'));

const AdminHome = lazy(() => import('../pages/admin/AdminHome'));
const AdminEntries = lazy(() => import('../pages/admin/entries/AdminEntries'));
const AdminAddEntry = lazy(() => import('../pages/admin/entries/AdminAddEntry'));
const AdminEditEntry = lazy(
  () => import('../pages/admin/entries/AdminEditEntry')
);
const AdminFeeds = lazy(() => import('../pages/admin/AdminFeeds'));
const AdminCategories = lazy(() => import('../pages/admin/AdminCategories'));
const AdminCatalogs = lazy(() => import('../pages/admin/AdminCatalogs'));
const AdminAuthors = lazy(() => import('../pages/admin/AdminAuthors'));
const AdminAccess = lazy(() => import('../pages/admin/AdminAccess'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminAIUsers = lazy(() => import('../pages/admin/AdminAIUsers'));
const AdminLoans = lazy(() => import('../pages/admin/AdminLoans'));

const BaseRoutes = () => {
  const { auth } = useAuthContext();

  return (
    <>
      {/* Fetch catalogs from API after authentication is available */}
      {auth && <CatalogInitializer />}

      <Routes>
        <Route element={<App />}>
          {/* Public */}
          <Route path='404' element={<NotFound />} />

          <Route
            path='login'
            element={
              auth ? <Navigate to={NAVIGATION_PATHS.home} replace /> : <Auth />
            }
          />

          {/* Catch all */}
          <Route
            path='*'
            element={<Navigate to={NAVIGATION_PATHS.notFound} replace />}
          ></Route>

          {/* Help — public, reachable without login */}
          {import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true' && (
            <>
              <Route path='help' element={<Help />} />
              <Route path='help/books' element={<HelpBooks />} />
              <Route path='help/search' element={<HelpSearch />} />
              <Route path='help/loans' element={<HelpLoans />} />
              <Route path='help/viewer' element={<HelpViewer />} />
              <Route path='help/ai' element={<HelpAi />} />
              <Route path='help/profile' element={<HelpProfile />} />
            </>
          )}

          {/* Only authorized */}
          <Route element={<RequireAuth />}>
            <Route index element={<Home />} />
            <Route path='library' element={<Library />} />
            <Route
              path='library/reservations/:reservation-id/claim'
              element={<ClaimReservation />}
            />
            <Route path='shelf' element={<Shelf />} />
            <Route path='profile' element={<Profile />} />
            {import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true' && (
              <Route path='history' element={<History />} />
            )}
            {import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true' && (
              <Route path='loans' element={<Loans />} />
            )}
            <Route path='feeds' element={<Feeds />} />
            <Route path='ai-assistant' element={<AiAssistantPage />} />
            <Route path='ai-chat-history' element={<AiChatHistory />} />
            <Route path='viewer/:entry-id/:index' element={<Viewer />} />

            {/* Only with admin role */}
            <Route path='administration' element={<RequireAdmin />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminHome />} />
                <Route path='entries'>
                  <Route index element={<AdminEntries />} />
                  <Route path='add' element={<AdminAddEntry />} />
                  <Route path='edit/:entry-id' element={<AdminEditEntry />} />
                </Route>
                <Route path='feeds' element={<AdminFeeds />} />
                <Route path='categories' element={<AdminCategories />} />
                <Route path='catalogs' element={<AdminCatalogs />} />
                <Route path='authors' element={<AdminAuthors />} />
                <Route path='access' element={<AdminAccess />} />
                <Route path='users' element={<AdminUsers />} />
                <Route path='ai-users' element={<AdminAIUsers />} />
                <Route path='loans' element={<AdminLoans />} />
              </Route>
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default BaseRoutes;
