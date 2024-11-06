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

const CookiesProvider = ({ children }: IContextProviderParams) => {
  const [cookies, setCookie, removeCookie] = useCookies([
    COOKIES_TYPE.AUTH_KEY,
    COOKIES_TYPE.LANG_KEY,
    COOKIES_TYPE.LAYOUT_KEY,
    COOKIES_TYPE.THEME_KEY,
    COOKIES_TYPE.INFOMED_KEY,
    COOKIES_TYPE.LICENSE_KEY,
  ]);
  const [informed, setInformed] = useState<boolean>(
    cookies[COOKIES_TYPE.INFOMED_KEY] === true
  );

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
