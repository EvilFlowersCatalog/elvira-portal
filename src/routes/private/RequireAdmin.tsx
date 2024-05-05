import { Navigate, Outlet } from 'react-router-dom';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import { useEffect, useState } from 'react';
import useVerifyAdmin from '../../hooks/api/verify/useVerifyAdmin';

const RequireAdmin = () => {
  const { auth, updateAuth, logout } = useAuthContext();
  const verifyAdmin = useVerifyAdmin();
  const [isSuperUser, setIsSuperUser] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [render, setRender] = useState<boolean>(false);

  useEffect(() => {
    // Skip initail render
    if (!render) {
      setRender(true);
      return;
    }

    // Verify admin
    const verify = async () => {
      try {
        const isAdmin = await verifyAdmin();
        setIsSuperUser(isAdmin);
        // Also update auth
        updateAuth({ isSuperUser: isAdmin });
        setIsMounted(true);
      } catch {
        // If somethign went wrong logout
        logout();
      }
    };

    // If user is not admin but he tries urls, just ignore it
    if (auth?.isSuperUser) verify();
    // Just set false
    else {
      setIsSuperUser(false);
      setIsMounted(true);
    }
  }, [render]);

  return (
    isMounted &&
    (isSuperUser ? (
      <Outlet />
    ) : (
      <Navigate to={NAVIGATION_PATHS.notFound} replace />
    ))
  );
};

export default RequireAdmin;
