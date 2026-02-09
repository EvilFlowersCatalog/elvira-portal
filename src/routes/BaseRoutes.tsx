import { Navigate, Route, Routes } from 'react-router-dom';
import App from '../App';
import Library from '../pages/common/Library';
import Shelf from '../pages/common/Shelf';
import AdminFeeds from '../pages/admin/AdminFeeds';
import NotFound from '../pages/common/NotFound';
import { NAVIGATION_PATHS } from '../utils/interfaces/general/general';
import RequireAuth from './guards/AuthGuard';
import useAuthContext from '../hooks/contexts/useAuthContext';
import RequireAdmin from './guards/AdminGuard';
import Viewer from '../pages/common/Viewer';
import Home from '../pages/common/Home';
import AdminEditEntry from '../pages/admin/entries/AdminEditEntry';
import AdminEntries from '../pages/admin/entries/AdminEntries';
import AdminCategories from '../pages/admin/AdminCategories';
import Feeds from '../pages/common/Feeds';
import AdminHome from '../pages/admin/AdminHome';
import AdminAddEntry from '../pages/admin/entries/AdminAddEntry';
import Auth from '../pages/auth/Auth';
import Loans from '../pages/common/Loans';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminAIUsers from '../pages/admin/AdminAIUsers';
import AdminLoans from '../pages/admin/AdminLoans';
import AiAssistantPage from '../pages/common/AiAssistant';
import AiChatHistory from '../pages/common/AiChatHistory';
import History from '../pages/common/History';
import CatalogInitializer from '../components/catalog/CatalogInitializer';

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

        {/* Only authorized */}
        <Route element={<RequireAuth />}>
          <Route index element={<Home />} />
          <Route path='library' element={<Library />} />
          <Route path='shelf' element={<Shelf />} />
          <Route path='history' element={<History />} />
          { import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true' && (
            <Route path='loans' element={<Loans />} />
          ) }
          <Route path='feeds' element={<Feeds />} />
          <Route path='ai-assistant' element={<AiAssistantPage />} />
          <Route path='ai-chat-history' element={<AiChatHistory />} />
          <Route path='viewer/:entry-id/:index' element={<Viewer />} />

          {/* Only with admin role */}
          <Route path='administration' element={<RequireAdmin />}>
            <Route index element={<AdminHome />} />
            <Route path='entries'>
              <Route index element={<AdminEntries />} />
              <Route path='add' element={<AdminAddEntry />} />
              <Route path='edit/:entry-id' element={<AdminEditEntry />} />
            </Route>
            <Route path='feeds' element={<AdminFeeds />} />
            <Route path='categories' element={<AdminCategories />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="ai-users" element={<AdminAIUsers />} />
            { import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true' && (
              <Route path='loans' element={<AdminLoans />} />
            ) }
          </Route>
        </Route>
      </Route>
    </Routes>
    </>
  );
};

export default BaseRoutes;
