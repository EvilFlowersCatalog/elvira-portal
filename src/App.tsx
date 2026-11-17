import { Outlet, useLocation } from 'react-router-dom';
import { NAVIGATION_PATHS } from './utils/interfaces/general/general';
import { ToastContainer } from 'react-toastify';
import NavbarContainer from './components/header/navbar/NavbarContainer';
import useCookiesContext from './hooks/contexts/useCookiesContext';
import CookiesInformation from './components/dialogs/CookiesInformation';
import { Suspense, useEffect } from 'react';
import Header from './components/header/Header';
import useAppContext from './hooks/contexts/useAppContext';
import PageLoading from './components/page/PageLoading';
import RouteErrorBoundary from './components/page/RouteErrorBoundary';
import { rememberSearch } from './utils/func/listSearch';
import GuideProvider from './providers/GuideProvider';
import AiAssistant from './components/dialogs/AiAssistant';
import AssistantLauncher from './components/assistant/AssistantLauncher';
import useFeatureSync from './features/useFeatureSync';
import { useFeature } from './features/features';

const App = () => {
  const { informed } = useCookiesContext();
  const { isSmallDevice } = useAppContext();
  // Which portal features are on (Administration › Features); the store re-renders its readers.
  useFeatureSync();
  const assistantOn = useFeature('assistant');

  const location = useLocation();

  const show = (): boolean => {
    return (
      !location.pathname.includes(NAVIGATION_PATHS.notFound) &&
      !location.pathname.includes(NAVIGATION_PATHS.viewer)
    );
  };

  // Keep each page's last query so in-app back links can return to it as it was left.
  useEffect(() => {
    rememberSearch(location.pathname, location.search);
  }, [location.pathname, location.search]);

  return (
    // The guide (assistant navigation) lives above the pages so it can move between them.
    <GuideProvider>
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
