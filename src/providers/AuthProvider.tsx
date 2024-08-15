import {
  createContext,
  MutableRefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  IAuth,
  IAuthCredentials,
  IUpdatedAuth,
} from '../utils/interfaces/auth';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { IContextProviderParams } from '../utils/interfaces/contexts';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAVIGATION_PATHS } from '../utils/interfaces/general/general';
import useVerifyCredentials from '../hooks/api/verify/useVerifyCredentials';
import useCustomEffect from '../hooks/useCustomEffect';
import useAxios from '../hooks/api/useAxios';
import axios, { CancelTokenSource } from 'axios';

export interface IAuthContext {
  auth: IAuth | null;
  updateAuth: (auth: IUpdatedAuth) => void;
  login: (loginForm: IAuthCredentials) => Promise<void>;
  logout: () => void;
  cancelTokenSource: MutableRefObject<CancelTokenSource>;
}

export const AuthContext = createContext<IAuthContext | null>(null);
// LOCAL SOTRAGE KEY
const AUTH_KEY = 'elvira-auth';
const BROADCAST_MESSAGE = 'logout';

const AuthProvider = ({ children }: IContextProviderParams) => {
  const { t } = useTranslation();

  const [auth, setAuth] = useState<IAuth | null>(
    JSON.parse(localStorage.getItem(AUTH_KEY) as string) || null
  );

  const logoutChannel = new BroadcastChannel(BROADCAST_MESSAGE);

  const verifyCredentials = useVerifyCredentials();
  const navigate = useNavigate();
  const location = useLocation();

  const cancelTokenSource = useRef<CancelTokenSource>(
    axios.CancelToken.source()
  );

  // listen to all tabs
  useEffect(() => {
    const handleLogout = () => {
      logout();
    };
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === AUTH_KEY) {
        setAuth(event.newValue ? JSON.parse(event.newValue) : null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    logoutChannel.onmessage = handleLogout;

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      logoutChannel.close();
    };
  }, []);

  const updateAuth = (newAuth: IUpdatedAuth) => {
    // Update auth
    if (auth) {
      setAuth({ ...auth, ...newAuth });
    }
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

  useCustomEffect(() => {
    if (auth) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(AUTH_KEY);
      logoutChannel.postMessage(BROADCAST_MESSAGE);

      if (location.pathname !== NAVIGATION_PATHS.login) {
        navigate(NAVIGATION_PATHS.login, {
          state: { from: location },
          replace: true,
        });
        toast.info(t('notifications.logout'));
      }
    }
  }, [auth]);

  const logout = () => {
    // Cancel all ongoing requests
    cancelTokenSource.current.cancel();

    // Reset the cancel token source
    cancelTokenSource.current = axios.CancelToken.source();
    setAuth(null); // set to null
  };

  return (
    <AuthContext.Provider
      value={{ auth, updateAuth, login, logout, cancelTokenSource }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
