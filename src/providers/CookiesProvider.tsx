import { createContext, useState } from 'react';
import { useCookies } from 'react-cookie';
import { CookieSetOptions } from 'universal-cookie';
import { IContextProviderParams } from '../utils/interfaces/contexts';
import { COOKIES_TYPE } from '../utils/interfaces/general/general';

export interface ICookieContext {
  cookies: any;
  setCookie: (
    name: COOKIES_TYPE,
    value: any,
    options?: CookieSetOptions
  ) => void;
  removeCookie: (name: COOKIES_TYPE, options?: CookieSetOptions) => void;
  informed: boolean;
  setInformed: (informed: boolean) => void;
}

export const CookiesContext = createContext<ICookieContext | null>(null);

// Security defaults applied to every cookie. `secure` is gated on HTTPS so the
// auth cookie still works on the plain-http dev server (localhost). `sameSite`
// hardens against cross-site sending; the sensitive value here is the auth cookie
// (it holds the refresh token), so these apply defence-in-depth on top of the
// Bearer-header API auth.
const SECURE_DEFAULTS: CookieSetOptions = {
  path: '/',
  sameSite: 'strict',
  secure:
    typeof window !== 'undefined' && window.location.protocol === 'https:',
};

const CookiesProvider = ({ children }: IContextProviderParams) => {
  const [cookies, rawSetCookie, rawRemoveCookie] = useCookies([
    COOKIES_TYPE.AUTH_KEY,
    COOKIES_TYPE.LANG_KEY,
    COOKIES_TYPE.LAYOUT_KEY,
    COOKIES_TYPE.THEME_KEY,
    COOKIES_TYPE.CATALOG_KEY,
    COOKIES_TYPE.INFOMED_KEY,
    COOKIES_TYPE.LICENSE_KEY,
  ]);
  const [informed, setInformed] = useState<boolean>(
    cookies[COOKIES_TYPE.INFOMED_KEY] === true
  );

  // Per-call options win over the security defaults (e.g. maxAge).
  const setCookie = (
    name: COOKIES_TYPE,
    value: any,
    options?: CookieSetOptions
  ) => rawSetCookie(name, value, { ...SECURE_DEFAULTS, ...options });

  const removeCookie = (name: COOKIES_TYPE, options?: CookieSetOptions) =>
    rawRemoveCookie(name, { path: '/', ...options });

  return (
    <CookiesContext.Provider
      value={{
        cookies,
        setCookie,
        removeCookie,
        informed,
        setInformed,
      }}
    >
      {children}
    </CookiesContext.Provider>
  );
};

export default CookiesProvider;
