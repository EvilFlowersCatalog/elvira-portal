import {
  createContext,
  useState,
  MouseEvent,
  RefObject,
  useEffect,
  useRef,
} from 'react';
import {
  COOKIES_TYPE,
  LANG_TYPE,
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../utils/interfaces/general/general';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { IContextProviderParams } from '../utils/interfaces/contexts';
import i18next from '../utils/i18n/i18next';
import useCookiesContext from '../hooks/contexts/useCookiesContext';

export interface AiMessageContent {
  type: "message" | 'entries' | 'loading';
  data: any;
}

export interface AiMessage {
  role: string;
  content: AiMessageContent;
  id?: string;
  bookIds?: string[];
}

export interface IAppContext {
  theme: THEME_TYPE;
  updateTheme: (theme: THEME_TYPE) => void;
  lang: LANG_TYPE;
  updateLang: (lang: LANG_TYPE) => void;
  clearFilters: () => void;
  specialNavigation: (
    event: MouseEvent<HTMLButtonElement>,
    path: NAVIGATION_PATHS | string,
    viewerFrom?: string
  ) => void;
  isSmallDevice: boolean;
  showNavbar: boolean;
  setShowNavbar: (showNavbar: boolean) => void;
  showAdvancedSearch: boolean;
  setShowAdvancedSearch: (showAdvancedSearch: boolean) => void;
  showAiAssistant: boolean;
  setShowAiAssistant: (showAiAssistant: boolean) => void;
  // AI Assistant persistent state
  aiChatId: string | null;
  setAiChatId: (chatId: string | null) => void;
  aiMessages: AiMessage[];
  setAiMessages: React.Dispatch<React.SetStateAction<AiMessage[]>>;
  aiShowSuggestions: boolean;
  setAiShowSuggestions: (show: boolean) => void;
  clearAiChat: () => void;
  isParamsEmpty: () => boolean;
  searchParamsEqual: (
    prevSearchParams: URLSearchParams | null,
    currentSearchParams: URLSearchParams
  ) => boolean;
  handleScroll: (
    scrollRef: RefObject<HTMLDivElement>,
    page: number,
    setPage: (page: number) => void,
    maxPage: number,
    loadingNext: boolean,
    setLoadingNext: (loadingNext: boolean) => void,
    showScrollUp: boolean,
    setShowScrollUp: (showScrollUp: boolean) => void
  ) => void;
  logoDark: string;
  logoLight: string;
  titleLogoDark: string;
  titleLogoLight: string;
  stuLogoDark: string;
  stuLogoLight: string;
  editingEntryTitle: string;
  setEditingEntryTitle: (editingEntryTitle: string) => void;
  selectedCatalogId: string | null;
  setSelectedCatalogId: (catalogId: string | null) => void;
  umamiTrack: (title: string, data?: Object) => void;
}

export const AppContext = createContext<IAppContext | null>(null);
const elviraTheme = import.meta.env.ELVIRA_THEME;

// assets / LOGOS
const logoDark = `/assets/${elviraTheme}/elvira/logo-dark.png`;
const logoLight = `/assets/${elviraTheme}/elvira/logo-light.png`;
const titleLogoDark = `/assets/${elviraTheme}/elvira/title-logo-dark.png`;
const titleLogoLight = `/assets/${elviraTheme}/elvira/title-logo-light.png`;
const stuLogoDark = `/assets/${elviraTheme}/stu/logo-dark.png`;
const stuLogoLight = `/assets/${elviraTheme}/stu/logo-light.png`;

const AppProvider = ({ children }: IContextProviderParams) => {
  const { cookies, setCookie } = useCookiesContext();

  const [theme, setTheme] = useState<THEME_TYPE>(
    cookies[COOKIES_TYPE.THEME_KEY] ?? THEME_TYPE.light
  );
  const [lang, setLang] = useState<LANG_TYPE>(
    cookies[COOKIES_TYPE.LANG_KEY] ?? LANG_TYPE.sk
  );
  const [showNavbar, setShowNavbar] = useState<boolean>(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState<boolean>(false);
  const [showAiAssistant, setShowAiAssistant] = useState<boolean>(false);
  const [editingEntryTitle, setEditingEntryTitle] = useState<string>('');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(
    import.meta.env.ELVIRA_CATALOG_ID || null
  );
  
  // AI Assistant persistent state
  const [aiChatId, setAiChatId] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiShowSuggestions, setAiShowSuggestions] = useState<boolean>(true);
  
  const clearAiChat = () => {
    setAiChatId(null);
    setAiMessages([]);
    setAiShowSuggestions(true);
  };
  const [isSmallDevice, setIsSmallDevice] = useState<boolean>(
    window.innerWidth < 959
  );
  const [searchParams, setSearchParams] = useSearchParams();

  // umami
  const [umamiParameters, setUmamiParameters] = useState<{
    query: string;
    parentId: string;
    title: string;
    author: string;
    categories: string[];
    feeds: string[];
    publishedAtGte: string;
    publishedAtLte: string;
    languageCode: string;
    orderBy: string;
  }>({
    query: '',
    parentId: '',
    title: '',
    author: '',
    categories: [],
    feeds: [],
    publishedAtGte: '',
    publishedAtLte: '',
    languageCode: '',
    orderBy: '',
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Update theme and localstorage
  const updateTheme = (theme: THEME_TYPE) => {
    setTheme(theme);
    setCookie(COOKIES_TYPE.THEME_KEY, theme, { maxAge: 60 * 60 * 24 * 365 }); // year
  };

  // Update lang and localstorage
  const updateLang = (lang: LANG_TYPE) => {
    setLang(lang);
    setCookie(COOKIES_TYPE.LANG_KEY, lang, { maxAge: 60 * 60 * 24 * 365 }); // year
  };

  // Special navigation stands for navigation that can open new window tab with holding ctr/cmd
  const specialNavigation = (
    event: MouseEvent<HTMLButtonElement>,
    path: NAVIGATION_PATHS | string,
    viewerFrom?: string
  ) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    event.preventDefault();

    // If ctrl or meta && is on mac open new tab
    if (event.ctrlKey || (event.metaKey && isMac) || event.button === 1)
      window.open(path, '_blank');
    else {
      if (viewerFrom) navigate(path, { state: { from: viewerFrom } });
      else navigate(path);
    }
  };

  const umamiTrack = (title: string, data?: Object) => {
    if (typeof umami !== 'undefined') umami.track(title, data);
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
      if (key !== 'entry-detail-id' && key !== 'parent-id') {
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

  // Set data-theme attribute on HTML root for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', elviraTheme);
  }, []);

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
    setEditingEntryTitle('');
    setShowAdvancedSearch(false);
  }, [location.pathname]);

  useEffect(() => {
    // handle resizeing window and set height/width
    const handleResize = () => {
      const newWidth: number = window.innerWidth;
      setIsSmallDevice(newWidth < 959);
    };

    // handle esc
    const handleESC = (e?: KeyboardEvent) => {
      if (e?.code?.toLocaleLowerCase() === 'escape') {
        searchParams.delete('entry-detail-id');
        setSearchParams(searchParams);
      }
    };

    // Attach the event listener when the component mounts
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleESC);
    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleESC);
    };
  }, [searchParams]);

  // track searchParam for umami
  useEffect(() => {
    setUmamiParameters({
      query: searchParams.get('query') || '',
      parentId: searchParams.get('parent-id') || '',
      title: searchParams.get('title') || '',
      author: searchParams.get('author') || '',
      categories: searchParams.get('categories')?.split(',') || [],
      feeds: searchParams.get('feeds')?.split(',') || [],
      publishedAtGte: searchParams.get('publishedAtGte') || '',
      publishedAtLte: searchParams.get('publishedAtLte') || '',
      languageCode: searchParams.get('languageCode') || '',
      orderBy: searchParams.get('orderBy') || '',
    });
  }, [searchParams]);
  const previousParams = useRef<{ [K in keyof typeof umamiParameters]?: any }>({});
  const paramEventMap: { [K in keyof typeof umamiParameters]: string } = {
    title: 'Title Param',
    parentId: 'Parent Param',
    query: 'Query Param',
    feeds: 'Feed Params',
    orderBy: 'Order By Param',
    categories: 'Category Param',
    author: 'Author Param',
    publishedAtGte: 'Published At GTE Param',
    publishedAtLte: 'Published At LTE Param',
    languageCode: 'Language Code Param',
  };
  useEffect(() => {

    (Object.entries(paramEventMap) as [keyof typeof umamiParameters, string][]).forEach(([key, eventName]) => {
      const value = umamiParameters[key];
      if (value !== null && value.length > 0 && previousParams.current[key] !== value) {
        umamiTrack(eventName, { [key]: value });
      }
    });

    previousParams.current = { ...umamiParameters };
  }, [umamiParameters]);

  return (
    <AppContext.Provider
      value={{
        theme,
        updateTheme,
        lang,
        updateLang,
        showNavbar,
        setShowNavbar,
        showAdvancedSearch,
        setShowAdvancedSearch,
        showAiAssistant,
        setShowAiAssistant,
        aiChatId,
        setAiChatId,
        aiMessages,
        setAiMessages,
        aiShowSuggestions,
        setAiShowSuggestions,
        clearAiChat,
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
        selectedCatalogId,
        setSelectedCatalogId,
        umamiTrack,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
