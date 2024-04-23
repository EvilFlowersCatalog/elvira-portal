import { createContext, useState, MouseEvent } from 'react';
import {
  LANG_TYPE,
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../utils/interfaces/general/general';
import { useNavigate } from 'react-router-dom';
import {
  IAppContext,
  IContextProviderParams,
} from '../utils/interfaces/contexts';
import tailwindConfig from '../../tailwind.config';

export const AppContext = createContext<IAppContext | null>(null);
// LOCAL SOTRAGE KEY
const THEME_KEY = 'elvira-theme';
const LANG_KEY = 'elvira-lang';

const AppProvider = ({ children }: IContextProviderParams) => {
  // Set initail value from theme and lang
  const getInitialTheme = () => {
    const theme = localStorage.getItem(THEME_KEY);
    return theme ? JSON.parse(theme) : THEME_TYPE.light;
  };
  const getInitialLang = () => {
    const lang = localStorage.getItem(LANG_KEY);
    return lang ? JSON.parse(lang) : LANG_TYPE.sk;
  };
  const [theme, setTheme] = useState<THEME_TYPE>(getInitialTheme);
  const [lang, setLang] = useState<LANG_TYPE>(getInitialLang);
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const { colors } = tailwindConfig.theme?.extend!;
  const navigate = useNavigate();

  // Update theme and localstorage
  const updateTheme = (theme: THEME_TYPE) => {
    setTheme(theme);
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  };

  // Update lang and localstorage
  const updateLang = (lang: LANG_TYPE) => {
    setLang(lang);
    localStorage.setItem(LANG_KEY, JSON.stringify(lang));
  };

  // Special navigation stands for navigation that can open new window tab with holding ctr/cmd
  const specialNavigation = (
    event: MouseEvent<HTMLButtonElement>,
    path: NAVIGATION_PATHS | string
  ) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    // If ctrl or meta && is on mac open new tab
    if (event.ctrlKey || (event.metaKey && isMac)) {
      event.preventDefault();
      window.open(path, '_blank');
    } else navigate(path);
  };

  // Function returns boolean based on where we want search to be visible
  const isSearchNeeded = (): boolean => {
    return (
      location.pathname.endsWith(NAVIGATION_PATHS.adminEntries) ||
      location.pathname.endsWith(NAVIGATION_PATHS.adminFeeds) ||
      location.pathname.endsWith(NAVIGATION_PATHS.feeds) ||
      location.pathname.endsWith(NAVIGATION_PATHS.myShelf) ||
      location.pathname.endsWith(NAVIGATION_PATHS.library) ||
      location.pathname.endsWith(NAVIGATION_PATHS.loansHistory)
    );
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        updateTheme,
        lang,
        updateLang,
        showLoader,
        setShowLoader,
        specialNavigation,
        isSearchNeeded,
        STUColor: (colors as { STUColor: string }).STUColor,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
