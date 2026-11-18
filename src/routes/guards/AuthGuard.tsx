import { Outlet } from 'react-router-dom';
import { isAxiosError } from 'axios';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import { useEffect, useState } from 'react';
import useRefreshToken from '../../hooks/api/verify/useRefreshToken';
import { isTokenFresh } from '../../lib/session';

/** Delays between retries of a refresh that failed for a transient reason. */
const RETRY_DELAYS_MS = [1000, 3000];

/**
 * Only the server refusing the refresh token ends the session. A network error,
 * a gateway 502/503/504 or a timeout says nothing about the session — logging
 * the user out on those (as this guard used to) throws away their work on a
 * blip, e.g. one 503 from the dev ingress during a deploy.
 */
const isSessionRejected = (error: unknown): boolean => {
  if (!isAxiosError(error)) return true; // e.g. no refresh token stored at all
  const status = error.response?.status;
  return status === 400 || status === 401 || status === 403;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const AuthGuard = () => {
  const { auth, updateAuth, logout } = useAuthContext();
  // A stored access token that is still valid lets the page render at once: the refresh below then runs
  // in the background instead of holding every page load (a refresh, a shared link) behind a blank screen
  // for one round-trip. An expired or unreadable token still waits for the refresh.
  const [verified, setVerified] = useState<boolean>(() => isTokenFresh(auth?.token));

  const refreshToken = useRefreshToken();

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          const token = await refreshToken();
          if (cancelled) return;
          updateAuth({ token });
          setVerified(true);
          return;
        } catch (error) {
          if (cancelled) return;
          if (isSessionRejected(error)) {
            logout();
            return;
          }
          if (attempt >= RETRY_DELAYS_MS.length) {
            // Still unreachable: keep the current access token (it lives far
            // longer than the refresh interval) and try again on the next tick.
            if (auth?.token) setVerified(true);
            else logout();
            return;
          }
          await sleep(RETRY_DELAYS_MS[attempt]);
        }
      }
    };

    refresh(); // Call first

    // Then every 4 min
    const intervalId = setInterval(refresh, 4 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return auth && verified && <Outlet />;
};

export default AuthGuard;
