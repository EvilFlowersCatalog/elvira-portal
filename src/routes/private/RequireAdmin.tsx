import { Navigate, Outlet } from 'react-router-dom';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import { useState } from 'react';
import useVerifyAdmin from '../../hooks/api/verify/useVerifyAdmin';
import useCustomEffect from '../../hooks/useCustomEffect';

const RequireAdmin = () => {
  const { auth, updateAuth, logout } = useAuthContext();
  const verifyAdmin = useVerifyAdmin();
  const [isSuperUser, setIsSuperUser] = useState<boolean>(false);
  const [verified, setVerified] = useState<boolean>(false);

  useCustomEffect(() => {
    // Verify admin
    const verify = async () => {
      try {
        const isSuperUser = await verifyAdmin();
        setIsSuperUser(isSuperUser);
        // Also update auth
        updateAuth({ isSuperUser });
        setVerified(true);
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
      setVerified(true);
    }
  }, []);

  return (
    verified &&
    (isSuperUser ? (
      <Outlet />
    ) : (
      <Navigate to={NAVIGATION_PATHS.notFound} replace />
    ))
  );
};

export default RequireAdmin;
