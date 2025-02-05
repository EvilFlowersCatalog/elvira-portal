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
import AdminLicences from '../pages/admin/AdminLicences';
import Licenses from '../pages/common/Licenses';

const BaseRoutes = () => {
  const { auth } = useAuthContext();

  return (
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
          <Route path='feeds' element={<Feeds />} />
          <Route path='licenses' element={<Licenses />} />
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
            <Route path='licenses' element={<AdminLicences />} />
            <Route path='categories' element={<AdminCategories />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};

export default BaseRoutes;
