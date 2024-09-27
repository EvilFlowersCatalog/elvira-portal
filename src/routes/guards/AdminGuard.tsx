import { Navigate, Outlet } from 'react-router-dom';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import { useEffect, useState } from 'react';
import useVerifyAdmin from '../../hooks/api/verify/useVerifyAdmin';

const AdminGuard = () => {
  const { auth, updateAuth, logout } = useAuthContext();
  const verifyAdmin = useVerifyAdmin();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [verified, setVerified] = useState<boolean>(false);

  useEffect(() => {
    // If user is not admin but he tries urls, just ignore it
    if (auth?.isSuperUser) {
      // Verify admin
      (async () => {
        try {
          const isSuperUser = await verifyAdmin();
          setIsAdmin(isSuperUser);

          // Also update auth
          updateAuth({ isSuperUser });
          setVerified(true);
        } catch {
          // If somethign went wrong logout
          logout();
        }
      })();
    } else {
      // Just set false
      setIsAdmin(false);

      //loaded
      setVerified(true);
    }
  }, []);

  return (
    verified &&
    (isAdmin ? <Outlet /> : <Navigate to={NAVIGATION_PATHS.notFound} replace />)
  );
};

export default AdminGuard;
