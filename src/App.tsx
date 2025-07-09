import { Outlet, useLocation } from 'react-router-dom';
import { NAVIGATION_PATHS } from './utils/interfaces/general/general';
import { ToastContainer } from 'react-toastify';
import NavbarContainer from './components/header/navbar/NavbarContainer';
import useCookiesContext from './hooks/contexts/useCookiesContext';
import CookiesInformation from './components/dialogs/CookiesInformation';
import { useEffect } from 'react';
import Header from './components/header/Header';
import useAppContext from './hooks/contexts/useAppContext';

const App = () => {
  const { informed } = useCookiesContext();
  const { isSmallDevice } = useAppContext();

  const location = useLocation();

  const show = (): boolean => {
    return (
      !location.pathname.includes(NAVIGATION_PATHS.notFound) &&
      !location.pathname.includes(NAVIGATION_PATHS.viewer)
    );
  };

  // Scripts for analytics
  useEffect(() => {
    const UMAMI_SERVER = import.meta.env.ELVIRA_UMAMI_SERVER;
    const UMAMI_WEBSITE = import.meta.env.ELVIRA_UMAMI_WEBSITE;

    if (UMAMI_SERVER && UMAMI_WEBSITE) {
      const script = document.createElement('script');
      script.defer = true;
      script.setAttribute('src', `${UMAMI_SERVER}/script.js`);
      script.setAttribute('data-website-id', UMAMI_WEBSITE);
      document.head.appendChild(script);
    }
  }, []);

  return (
    <>
      {/* COOKIE */}
      <ToastContainer
        position='top-right'
        autoClose={2500}
        pauseOnHover={false}
        theme={'dark'}
      />
      {!informed && <CookiesInformation />}
      <div className='h-screen flex w-screen bg-white dark:bg-gray text-black dark:text-white'>
        {show() && (
          <>
            <NavbarContainer />
            {isSmallDevice && <Header />}
          </>
        )}

        <div
          className={`flex flex-1 h-screen flex-col overflow-hidden bg-lightGray dark:bg-darkGray ${
            show() ? 'max-lg:pt-14' : ''
          }`}
        >
          <Outlet />
        </div>

      </div>
    </>
  );
};

export default App;
