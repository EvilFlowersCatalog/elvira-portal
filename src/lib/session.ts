import Cookies from 'universal-cookie';
import { COOKIES_TYPE } from '../utils/interfaces/general/general';
import type { IAuth } from '../utils/interfaces/auth';

/**
 * The stored session, readable outside React: route loaders run before any provider renders, and the axios
 * interceptors need the token from the very first request of a page load (a deep link or a refresh).
 * AuthProvider stays the owner; this only reads the cookie it writes.
 */
export const readStoredAuth = (): IAuth | null => {
  try {
    const value = new Cookies().get(COOKIES_TYPE.AUTH_KEY);
    return value && typeof value === 'object' && value.token ? (value as IAuth) : null;
  } catch {
    return null;
  }
};

/** Seconds since the epoch at which a JWT expires, or null when it can't be read. */
const jwtExpiry = (token: string): number | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
};

/**
 * Whether an access token can still be used for at least `marginSeconds`. Lets the auth guard show the
 * page at once and refresh in the background, instead of a blank screen for one refresh round-trip on
 * every page load. An unreadable token is treated as expired (the guard then waits for the refresh).
 */
export const isTokenFresh = (token: string | null | undefined, marginSeconds = 30): boolean => {
  if (!token) return false;
  const exp = jwtExpiry(token);
  return exp !== null && exp - marginSeconds > Date.now() / 1000;
};
