import {
  createContext,
  useState,
  MouseEvent,
  useEffect,
  RefObject,
} from 'react';
import {
  LANG_TYPE,
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../utils/interfaces/general/general';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  IAppContext,
  IContextProviderParams,
} from '../utils/interfaces/contexts';
import tailwindConfig from '../../tailwind.config';
import i18next from '../utils/i18n/i18next';

export const AppContext = createContext<IAppContext | null>(null);
// LOCAL SOTRAGE KEY
const THEME_KEY = 'elvira-theme';
const LANG_KEY = 'elvira-lang';

// IMAGES / LOGOS
const logoDark = `/assets/${
  import.meta.env.ELVIRA_ASSETS_DIR
}/elvira/logo-dark.png`;
const logoLight = `/assets/${
  import.meta.env.ELVIRA_ASSETS_DIR
}/elvira/logo-light.png`;
const titleLogoDark = `/assets/${
  import.meta.env.ELVIRA_ASSETS_DIR
}/elvira/title-logo-dark.png`;
const titleLogoLight = `/assets/${
  import.meta.env.ELVIRA_ASSETS_DIR
}/elvira/title-logo-light.png`;
const stuLogoDark = `/assets/${
  import.meta.env.ELVIRA_ASSETS_DIR
}/stu/logo-dark.png`;
const stuLogoLight = `/assets/${
  import.meta.env.ELVIRA_ASSETS_DIR
}/stu/logo-light.png`;

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
  const { colors } = tailwindConfig.theme?.extend!;
  const [theme, setTheme] = useState<THEME_TYPE>(getInitialTheme);
  const [lang, setLang] = useState<LANG_TYPE>(getInitialLang);
  const [showNavbar, setShowNavbar] = useState<boolean>(false);
  const [editingEntryTitle, setEditingEntryTitle] = useState<string>('');
  const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
  const [isSmallDevice, setIsSmallDevice] = useState<boolean>(
    window.innerWidth < 959
  );
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();
  const location = useLocation();

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
    event.preventDefault();

    // If ctrl or meta && is on mac open new tab
    if (event.ctrlKey || (event.metaKey && isMac) || event.button === 1)
      window.open(path, '_blank');
    else navigate(path);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();

    const entryDetailId = searchParams.get('entry-detail-id');
    if (entryDetailId) params.set('entry-detail-id', entryDetailId);

    setSearchParams(params);
  };

  const isParamsEmpty = () => {
    // do not count entry-detail-id
    for (let [key] of searchParams.entries()) {
      if (key !== 'entry-detail-id') {
        return false;
      }
    }
    return true;
  };

  // Function for ignoring entry-detail-id
  const searchParamsEqual = (
    prevSearchParams: URLSearchParams | null,
    currentSearchParams: URLSearchParams
  ) => {
    // If we do not have prev return false
    if (!prevSearchParams) return false;

    // Get prev params except entry-detail-id
    const { 'entry-detail-id': prevId, ...prevRest } = Object.fromEntries(
      prevSearchParams.entries()
    );

    // Get current params except entry-detail-id
    const { 'entry-detail-id': currId, ...currRest } = Object.fromEntries(
      currentSearchParams.entries()
    );

    // Chcek prev
    for (let key in prevRest) {
      if (prevRest[key] !== currRest[key]) {
        return false;
      }
    }
    // Chcek curr
    for (let key in currRest) {
      if (prevRest[key] !== currRest[key]) {
        return false;
      }
    }
    return true;
  };

  // handle scrolling and loading next datas
  const handleScroll = (
    scrollRef: RefObject<HTMLDivElement>,
    page: number,
    setPage: (page: number) => void,
    maxPage: number,
    loadingNext: boolean,
    setLoadingNext: (loadingNext: boolean) => void,
    showScrollUp: boolean,
    setShowScrollUp: (showScrollUp: boolean) => void
  ) => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

      // if we are at buttom load next data
      if (
        scrollTop + clientHeight > scrollHeight - 50 &&
        page !== maxPage &&
        !loadingNext
      ) {
        setLoadingNext(true);
        setPage(page + 1);
      }

      // if lower than height set false the button scroll up
      if (showScrollUp && scrollTop < window.innerHeight)
        setShowScrollUp(false);
      // else show
      if (!showScrollUp && scrollTop > window.innerHeight)
        setShowScrollUp(true);
    }
  };

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    // Set languege based on given language
    if (lang === LANG_TYPE.sk) {
      i18next.changeLanguage('sk');
    } else if (lang === LANG_TYPE.en) {
      i18next.changeLanguage('en');
    } else {
      i18next.changeLanguage('en');
    }
  }, [lang]);

  // Each page change reset
  useEffect(() => {
    setShowNavbar(false);
    setShowSearchBar(false);
    setEditingEntryTitle('');
  }, [location.pathname]);

  useEffect(() => {
    // handle resizeing window and set height/width
    const handleResize = () => {
      const newWidth: number = window.innerWidth;
      setIsSmallDevice(newWidth < 959);
    };

    // Attach the event listener when the component mounts
    window.addEventListener('resize', handleResize);
    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        theme,
        updateTheme,
        lang,
        updateLang,
        showNavbar,
        setShowNavbar,
        showSearchBar,
        setShowSearchBar,
        specialNavigation,
        clearFilters,
        isSmallDevice,
        searchParamsEqual,
        isParamsEmpty,
        handleScroll,
        titleLogoDark,
        titleLogoLight,
        stuLogoLight,
        stuLogoDark,
        logoDark,
        logoLight,
        editingEntryTitle,
        setEditingEntryTitle,
        STUColor: (colors as { STUColor: string }).STUColor,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
