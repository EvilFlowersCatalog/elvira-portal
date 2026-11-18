import { Outlet, useLocation, useNavigation, useSearchParams } from 'react-router-dom';
import { NAVIGATION_PATHS } from './utils/interfaces/general/general';
import { ToastContainer } from 'react-toastify';
import NavbarContainer from './components/header/navbar/NavbarContainer';
import useCookiesContext from './hooks/contexts/useCookiesContext';
import CookiesInformation from './components/dialogs/CookiesInformation';
import { lazy, Suspense, useEffect } from 'react';
import Header from './components/header/Header';
import useAppContext from './hooks/contexts/useAppContext';
import PageLoading from './components/page/PageLoading';
import RouteErrorBoundary from './components/page/RouteErrorBoundary';
import { rememberSearch } from './utils/func/listSearch';
import GuideProvider from './providers/GuideProvider';
import AiAssistant from './components/dialogs/AiAssistant';
import AssistantLauncher from './components/assistant/AssistantLauncher';
import { loadEntryDialog } from './routes/pages';
import useFeatureSync from './features/useFeatureSync';
import { useFeature } from './features/features';
import useAuthContext from './hooks/contexts/useAuthContext';
import { isReaderPath } from './lib/links/paths';

const EntryDialogHost = lazy(loadEntryDialog);

/**
 * A thin bar while the router fetches the next page's chunk or runs its loader. The current page stays on
 * screen meanwhile (data router), so this is the only sign of a slow navigation; it appears after a short
 * delay so fast navigations show nothing.
 */
const NavigationProgress = () => {
  const navigation = useNavigation();
  if (navigation.state === 'idle') return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[2000] h-0.5 overflow-hidden opacity-0 animate-[fadeIn_0.2s_ease-out_0.15s_forwards]" role="progressbar" aria-busy="true">
      <div className="h-full w-1/3 animate-[loadingbar_1s_ease-in-out_infinite] bg-primary" />
    </div>
  );
};

const App = () => {
  const { informed } = useCookiesContext();
  const { isSmallDevice } = useAppContext();
  const { auth } = useAuthContext();
  // Which portal features are on (Administration › Features); the store re-renders its readers.
  useFeatureSync();
  const assistantOn = useFeature('assistant');

  const location = useLocation();
  const [searchParams] = useSearchParams();

  const show = (): boolean => !location.pathname.includes(NAVIGATION_PATHS.notFound) && !isReaderPath(location.pathname);

  // Keep each page's last query so in-app back links can return to it as it was left.
  useEffect(() => {
    rememberSearch(location.pathname, location.search);
  }, [location.pathname, location.search]);

  return (
    // The guide (assistant navigation) lives above the pages so it can move between them.
    <GuideProvider>
      <NavigationProgress />
      {/* COOKIE */}
      <ToastContainer
        position='top-right'
        autoClose={2500}
        pauseOnHover={false}
        theme={'dark'}
      />
      {!informed && <CookiesInformation />}
      <div className='h-screen flex w-full text-black dark:text-white'>
        {show() && (
          <>
            <NavbarContainer />
            {isSmallDevice && <Header />}
          </>
        )}

        <div
          id="outlet-wrapper"
          className={`flex flex-1 h-screen flex-col overflow-hidden bg-lightGray dark:bg-darkGray ${show() ? 'max-lg:pt-14' : ''}`}
        >
          <RouteErrorBoundary>
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </RouteErrorBoundary>
        </div>

      </div>
      {/* One publication dialog (and borrow dialog) for every page, driven by the URL. Its code is a chunk of
          its own, loaded when a dialog opens (and preloaded on hovering a card, prefetchEntry). */}
      {auth && (searchParams.has('entry-detail-id') || searchParams.has('licensing-entry-id')) && (
        <Suspense fallback={null}>
          <EntryDialogHost />
        </Suspense>
      )}
      {/* One assistant for the whole portal, so it stays open (and keeps its chat) across pages. */}
      {assistantOn && (
        <>
          <AiAssistant />
          <AssistantLauncher />
        </>
      )}
    </GuideProvider>
  );
};

export default App;
