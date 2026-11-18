import { ComponentType } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import CookiesProvider from '../providers/CookiesProvider';
import AppProvider from '../providers/AppProvider';
import AuthProvider from '../providers/AuthProvider';
import useAuthContext from '../hooks/contexts/useAuthContext';
import { safeNext } from '../lib/links/paths';
import { NAVIGATION_PATHS } from '../utils/interfaces/general/general';

/** Providers that need the router (navigation, search params) sit inside it, above every route. */
export const RootLayout = () => (
  <CookiesProvider>
    <AppProvider>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </AppProvider>
  </CookiesProvider>
);

/** `/login`: the form, or — signed in already — where the login link was going to take them (`?next=`). */
export const LoginRoute = ({ Auth }: { Auth: ComponentType }) => {
  const { auth } = useAuthContext();
  if (!auth) return <Auth />;
  const next = safeNext(new URLSearchParams(window.location.search).get('next'), NAVIGATION_PATHS.home);
  return <Navigate to={next} replace />;
};
