import { Navigate, Route, Routes } from 'react-router-dom';
import App from '../App';
import Login from '../pages/Login';
import Library from '../pages/auth/Library';
import MyShelf from '../pages/auth/MyShelf';
import Feeds from '../pages/auth/Feeds';
import AdvancedSearch from '../pages/auth/AdvancedSearch';
import AdminHome from '../pages/admin/AdminHome';
import AdminEntries from '../pages/admin/AdminEntries';
import AdminFeeds from '../pages/admin/AdminFeeds';
import NotFound from '../pages/NotFound';
import { NAVIGATION_PATHS } from '../utils/interfaces/general/general';
import RequireAuth from './private/RequireAuth';
import useAuthContext from '../hooks/useAuthContext';
import RequireAdmin from './private/RequireAdmin';
import Viewer from '../pages/auth/Viewer';
import LoansHistroy from '../pages/auth/LoansHistroy';
import Home from '../pages/auth/Home';
import EntryManipulation from '../pages/admin/EntryManipulation';
import About from '../pages/auth/About';

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
          <Route path='/' element={<Home />} />
          <Route path='about' element={<About />} />
          <Route path='library' element={<Library />} />
          <Route path='my-shelf' element={<MyShelf />} />
          <Route path='loans-history' element={<LoansHistroy />} />
          <Route path='feeds' element={<Feeds />} />
          <Route path='advanced-search' element={<AdvancedSearch />} />
          <Route path='viewer/:entry-id' element={<Viewer />} />

          {/* Only with admin role */}
          <Route path='admin' element={<RequireAdmin />}>
            <Route
              index
              element={<Navigate to={NAVIGATION_PATHS.adminHome} replace />}
            />
            <Route path='home' element={<AdminHome />} />
            <Route path='entries'>
              <Route index element={<AdminEntries />} />
              <Route path='add' element={<EntryManipulation />} />
              <Route path='edit/:id' element={<EntryManipulation edit />} />
            </Route>
            <Route path='feeds' element={<AdminFeeds />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
};

export default BaseRoutes;
