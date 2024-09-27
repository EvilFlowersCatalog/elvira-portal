import { Outlet } from 'react-router-dom';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import { useEffect, useState } from 'react';
import useRefreshToken from '../../hooks/api/verify/useRefreshToken';

const AuthGuard = () => {
  const { auth, updateAuth, logout } = useAuthContext();
  const [verified, setVerified] = useState<boolean>(false);

  const refreshToken = useRefreshToken();

  useEffect(() => {
    // Refresh token
    const refresh = async () => {
      try {
        const token = await refreshToken();
        updateAuth({ token });
        setVerified(true);
      } catch {
        logout();
      }
    };

    refresh(); // Call first

    // Then every 4 min
    const intervalId = setInterval(refresh, 4 * 60 * 1000);
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return auth && verified && <Outlet />;
};

export default AuthGuard;
