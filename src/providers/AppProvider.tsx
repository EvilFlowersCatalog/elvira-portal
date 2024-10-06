import {
  createContext,
  useState,
  MouseEvent,
  RefObject,
  useEffect,
} from 'react';
import {
  COOKIES_TYPE,
  LANG_TYPE,
  LAYOUT_TYPE,
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../utils/interfaces/general/general';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { IContextProviderParams } from '../utils/interfaces/contexts';
import i18next from '../utils/i18n/i18next';
import useCookiesContext from '../hooks/contexts/useCookiesContext';

export interface IAppContext {
  theme: THEME_TYPE;
  updateTheme: (theme: THEME_TYPE) => void;
  lang: LANG_TYPE;
  updateLang: (lang: LANG_TYPE) => void;
  layout: LAYOUT_TYPE;
  updateLayout: (layout: LAYOUT_TYPE) => void;
  clearFilters: () => void;
  specialNavigation: (
    event: MouseEvent<HTMLButtonElement>,
    path: NAVIGATION_PATHS | string
  ) => void;
  isSmallDevice: boolean;
  showNavbar: boolean;
  setShowNavbar: (showNavbar: boolean) => void;
  showSearchBar: boolean;
  setShowSearchBar: (showSearchBar: boolean) => void;
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
  feedParents: { id: string; title: string }[];
  setFeedParents: (feedParents: { id: string; title: string }[]) => void;
  setEditingEntryTitle: (editingEntryTitle: string) => void;
  stuBorder: string;
  stuBorderFocus: string;
  stuBg: string;
  stuBgHover: string;
  stuText: string;
  stuColor: string;
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
  const [layout, setLayout] = useState<LAYOUT_TYPE>(
    cookies[COOKIES_TYPE.LAYOUT_KEY] ?? LAYOUT_TYPE.box
  );
  const [showNavbar, setShowNavbar] = useState<boolean>(false);
  const [editingEntryTitle, setEditingEntryTitle] = useState<string>('');
  const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
  const [isSmallDevice, setIsSmallDevice] = useState<boolean>(
    window.innerWidth < 959
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const [feedParents, setFeedParents] = useState<
    { id: string; title: string }[]
  >([]);

  // umami
  const [entryDetailId, setEntryDetailId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [feedId, setFeedId] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [author, setAuthor] = useState<string | null>(null);
  // check main.css
  const [stuColors] = useState<{ [key: string]: string }[]>([
    // backgournd 0
    {
      fiit: 'fiit-bg',
      fchpt: 'fchpt-bg',
      fei: 'fei-bg',
      mtf: 'mtf-bg',
      fad: 'fad-bg',
      svf: 'svf-bg',
      sjf: 'sjf-bg',
    },
    // border 1
    {
      fiit: 'fiit-border',
      fchpt: 'fchpt-border',
      fei: 'fei-border',
      mtf: 'mtf-border',
      fad: 'fad-border',
      svf: 'svf-border',
      sjf: 'sjf-border',
    },
    // background hover 2
    {
      fiit: 'fiit-bg-hover',
      fchpt: 'fchpt-bg-hover',
      fei: 'fei-bg-hover',
      mtf: 'mtf-bg-hover',
      fad: 'fad-bg-hover',
      svf: 'svf-bg-hover',
      sjf: 'sjf-bg-hover',
    },
    // border focus 3
    {
      fiit: 'fiit-border-focus',
      fchpt: 'fchpt-border-focus',
      fei: 'fei-border-focus',
      mtf: 'mtf-border-focus',
      fad: 'fad-border-focus',
      svf: 'svf-border-focus',
      sjf: 'sjf-border-focus',
    },
    // text 4
    {
      fiit: 'fiit-text',
      fchpt: 'fchpt-text',
      fei: 'fei-text',
      mtf: 'mtf-text',
      fad: 'fad-text',
      svf: 'svf-text',
      sjf: 'sjf-text',
    },
    // hash colors 5
    {
      fiit: '#01a9e0',
      mtf: '#e62b1e',
      svf: '#e5722a',
      sjf: '#4c5b60',
      fei: '#0c4a8e',
      fchpt: '#ffda1c',
      fad: '#009d4a',
    },
  ]);

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

  // Update layout and localstorage
  const updateLayout = (layout: LAYOUT_TYPE) => {
    setLayout(layout);
    setCookie(COOKIES_TYPE.LAYOUT_KEY, layout, { maxAge: 60 * 60 * 24 * 365 }); // year
  };

  // Special navigation stands for navigation that can open new window tab with holding ctr/cmd
  const specialNavigation = (
    event: MouseEvent<HTMLButtonElement>,
    path: NAVIGATION_PATHS | string
  ) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    event.preventDefault();

    // If ctrl or meta && is on mac open new tab
    if (event.ctrlKey || (event.metaKey && isMac) || event.button === 2)
      window.open(path, '_blank');
    else navigate(path);
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
      if (newWidth < 959) updateLayout(LAYOUT_TYPE.box);
      setIsSmallDevice(newWidth < 959);
    };

    // handle esc
    const handleESC = (e?: KeyboardEvent) => {
      if (e?.code?.toLocaleLowerCase() === 'escape') {
        searchParams.delete('entry-detail-id');
        setSearchParams(searchParams);
        setShowSearchBar(false);
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
  }, []);

  // track searchParam for umami
  useEffect(() => {
    setEntryDetailId(searchParams.get('entry-detail-id'));
    setParentId(searchParams.get('parent-id'));
    setQuery(searchParams.get('query'));
    setTitle(searchParams.get('title'));
    setFeedId(searchParams.get('feed-id'));
    setOrderBy(searchParams.get('order-by'));
    setCategoryId(searchParams.get('category-id'));
    setAuthor(searchParams.get('author'));
  }, [searchParams]);
  useEffect(() => {
    if (entryDetailId !== null) {
      umamiTrack('Entry Detail Param', { entryId: entryDetailId });
    }
  }, [entryDetailId]);
  useEffect(() => {
    if (parentId !== null) {
      umamiTrack('Parent Param', { parentId });
    }
  }, [parentId]);
  useEffect(() => {
    if (query !== null) {
      umamiTrack('Query Param', { query });
    }
  }, [query]);
  useEffect(() => {
    if (title !== null) {
      umamiTrack('Title Param', { title });
    }
  }, [title]);
  useEffect(() => {
    if (feedId !== null) {
      umamiTrack('Feed Param', { feedId });
    }
  }, [feedId]);
  useEffect(() => {
    if (orderBy !== null) {
      umamiTrack('Order By Param', { orderBy });
    }
  }, [orderBy]);
  useEffect(() => {
    if (categoryId !== null) {
      umamiTrack('Category Param', { categoryId });
    }
  }, [categoryId]);
  useEffect(() => {
    if (author !== null) {
      umamiTrack('Author Param', { author: author });
    }
  }, [author]);

  return (
    <AppContext.Provider
      value={{
        theme,
        updateTheme,
        lang,
        updateLang,
        layout,
        updateLayout,
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
        feedParents,
        setFeedParents,
        stuBg: stuColors[0][elviraTheme],
        stuBorder: stuColors[1][elviraTheme],
        stuBgHover: stuColors[2][elviraTheme],
        stuBorderFocus: stuColors[3][elviraTheme],
        stuText: stuColors[4][elviraTheme],
        stuColor: stuColors[5][elviraTheme],
        umamiTrack,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
