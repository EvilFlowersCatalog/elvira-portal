import { createContext, useEffect, useState } from 'react';
import {
  IAuth,
  IAuthCredentials,
  IUpdatedAuth,
} from '../utils/interfaces/auth';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  IAuthContext,
  IContextProviderParams,
} from '../utils/interfaces/contexts';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAVIGATION_PATHS } from '../utils/interfaces/general/general';
import useVerifyCredentials from '../hooks/api/verify/useVerifyCredentials';

export const AuthContext = createContext<IAuthContext | null>(null);
// LOCAL SOTRAGE KEY
const AUTH_KEY = 'elvira-auth';
const BROADCAST_MESSAGE = 'logout';

const AuthProvider = ({ children }: IContextProviderParams) => {
  const { t } = useTranslation();

  const [auth, setAuth] = useState<IAuth | null>(
    (() => {
      // Get auth from storage
      const auth = localStorage.getItem(AUTH_KEY);
      // If it exists parse it and return else return null
      return auth ? JSON.parse(auth) : null;
    })()
  );
  const navigate = useNavigate();
  const location = useLocation();
  const verifyCredentials = useVerifyCredentials();
  const logoutChannel = new BroadcastChannel(BROADCAST_MESSAGE);

  // listen to logout message
  useEffect(() => {
    const onmessage = () => {
      logout();
      logoutChannel.close();
    };
    logoutChannel.onmessage = onmessage;
  }, []);

  const updateAuth = (newAuth: IUpdatedAuth) => {
    // Update auth
    if (auth) setAuth({ ...auth, ...newAuth });
  };

  const login = async (loginForm: IAuthCredentials) => {
    try {
      const { response: user } = await verifyCredentials(loginForm); // verify given credentials

      // Set auth with given values
      setAuth({
        userId: user.user.id,
        username: user.user.username,
        isSuperUser: user.user.is_superuser,
        token: user.access_token,
        refreshToken: user.refresh_token,
      });

      // Get where the user lastly was / if does not exist, go to home
      const pathname = location.state?.from?.pathname ?? NAVIGATION_PATHS.home;
      const params = location.state?.from?.search ?? '';

      const from = pathname + params;

      // Navigate to where was user lastly or to library
      toast.success(t('notifications.login.success')); // Notify succes
      navigate(from, { replace: true });
    } catch {
      toast.error(t('notifications.login.error'));
    }
  };

  useEffect(() => {
    // Whenever auth is changed, save it to local storage
    if (auth) localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    else if (!location.pathname.includes(NAVIGATION_PATHS.login)) {
      logoutChannel.postMessage('Logout');
      localStorage.removeItem(AUTH_KEY);

      navigate(NAVIGATION_PATHS.login, {
        state: { from: location },
        replace: true,
      });
      toast.info(t('notifications.logout'));
    }
  }, [auth]);

  const logout = () => {
    setAuth(null); // set to null
  };

  return (
    <AuthContext.Provider value={{ auth, updateAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
