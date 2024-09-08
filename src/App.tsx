import { Outlet, useLocation } from 'react-router-dom';
import { NAVIGATION_PATHS } from './utils/interfaces/general/general';
import { ToastContainer } from 'react-toastify';
import NavbarContainer from './components/header/navbar/NavbarContainer';
import Header from './components/header/Header';
import useAppContext from './hooks/contexts/useAppContext';
import SearchBarContainer from './components/search-bar/SearchBarContainer';
import useCustomEffect from './hooks/useCustomEffect';
import useCookiesContext from './hooks/contexts/useCookiesContext';
import CookiesInformation from './components/dialogs/CookiesInformation';

const App = () => {
  const { isSmallDevice } = useAppContext();
  const { informed } = useCookiesContext();

  const location = useLocation();

  const show = (): boolean => {
    return (
      !location.pathname.includes(NAVIGATION_PATHS.notFound) &&
      !location.pathname.includes(NAVIGATION_PATHS.viewer)
    );
  };

  // Scripts for analysis
  useCustomEffect(() => {
    // Development
    if (import.meta.env.ELVIRA_DEV === 'true') {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://analytics.elvira.fiit.stuba.sk/script.js';
      script.setAttribute(
        'data-website-id',
        'afe12559-da42-4f71-99f0-18fffc15ba67'
      );
      document.head.appendChild(script);
    }
    // Production
    else if (import.meta.env.ELVIRA_PROD === 'true') {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://analytics.elvira.fiit.stuba.sk/script.js';
      script.setAttribute(
        'data-website-id',
        '2fb837fb-1927-404a-8154-32df4945927c'
      );
      document.head.appendChild(script);
    }
  }, []);

  return (
    <>
      {/* COOKIE */}
      {!informed && <CookiesInformation />}
      <div className='min-h-screen h-screen flex w-screen bg-white dark:bg-gray text-black dark:text-white overflow-auto'>
        <div className={`min-w-64 flex flex-1`}>
          <ToastContainer
            position='top-right'
            autoClose={2500}
            pauseOnHover={false}
            theme={'dark'}
          />

          {show() && (
            <>
              <NavbarContainer />
              {isSmallDevice && <Header />}
            </>
          )}

          <div
            className={`flex flex-1 flex-col overflow-auto ${
              show() ? 'pt-14 lg:pt-0' : ''
            }`}
          >
            <Outlet />
          </div>

          <SearchBarContainer />
        </div>
      </div>
    </>
  );
};

export default App;
