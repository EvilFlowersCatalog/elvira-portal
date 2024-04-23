import { Outlet } from 'react-router-dom';
import useAuthContext from '../../hooks/useAuthContext';
import { useEffect, useState } from 'react';
import useRefreshToken from '../../hooks/api/verify/useRefreshToken';

const RequireAuth = () => {
  const { auth, updateAuth, logout } = useAuthContext();
  const refreshToken = useRefreshToken();
  const [render, setRender] = useState<boolean>(false);

  useEffect(() => {
    // Skip initail render
    if (!render) {
      setRender(true);
      return;
    }

    // Refresh token
    const refresh = async () => {
      try {
        const newToken = await refreshToken();
        updateAuth({ token: newToken });
      } catch {
        logout();
      }
    };

    refresh(); // Call first
    // Then every 4 min
    const intervalId = setInterval(refresh, 4 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [render]);

  return auth && <Outlet />;
};

export default RequireAuth;
