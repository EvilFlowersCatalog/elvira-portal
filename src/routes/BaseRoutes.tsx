import { Navigate, Route, Routes } from 'react-router-dom';
import App from '../App';
import Login from '../pages/auth/Login';
import Library from '../pages/common/Library';
import Shelf from '../pages/common/Shelf';
import Feeds from '../pages/common/Feeds';
import AdvancedSearch from '../pages/common/AdvancedSearch';
import AdminHome from '../pages/admin/AdminHome';
import AdminFeeds from '../pages/admin/AdminFeeds';
import NotFound from '../pages/NotFound';
import { NAVIGATION_PATHS } from '../utils/interfaces/general/general';
import RequireAuth from './private/RequireAuth';
import useAuthContext from '../hooks/contexts/useAuthContext';
import RequireAdmin from './private/RequireAdmin';
import Viewer from '../pages/common/Viewer';
import Home from '../pages/common/Home';
import About from '../pages/common/About';
import Loans from '../pages/common/Loans';
import AdminAddEntry from '../pages/admin/entries/AdminAddEntry';
import AdminEditEntry from '../pages/admin/entries/AdminEditEntry';
import AdminEntries from '../pages/admin/entries/AdminEntries';

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
            auth ? <Navigate to={NAVIGATION_PATHS.home} replace /> : <Login />
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
          <Route path='about' element={<About />} />
          <Route path='library' element={<Library />} />
          <Route path='shelf' element={<Shelf />} />
          <Route path='loans' element={<Loans />} />
          <Route path='feeds' element={<Feeds />} />
          <Route path='advanced-search' element={<AdvancedSearch />} />
          <Route path='viewer/:entry-id' element={<Viewer />} />

          {/* Only with admin role */}
          <Route path='administration' element={<RequireAdmin />}>
            <Route index element={<AdminHome />} />
            <Route path='entries'>
              <Route index element={<AdminEntries />} />
              <Route path='add' element={<AdminAddEntry />} />
              <Route path='edit/:id' element={<AdminEditEntry />} />
            </Route>
            <Route path='feeds' element={<AdminFeeds />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};

export default BaseRoutes;
