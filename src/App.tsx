import { Outlet, useLocation } from 'react-router-dom';
import {
  LANG_TYPE,
  NAVIGATION_PATHS,
} from './utils/interfaces/general/general';
import { useEffect } from 'react';
import i18next from './utils/i18n/i18next';
import useAppContext from './hooks/useAppContext';
import Loader from './components/common/Loader';
import { ToastContainer } from 'react-toastify';
import Header from './components/header/Header';

const App = () => {
  const { theme, lang, showLoader } = useAppContext();
  const location = useLocation();

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

  return (
    <div className='h-screen w-screen flex flex-col md:flex-row bg-white dark:bg-gray'>
      {!location.pathname.includes(NAVIGATION_PATHS.notFound) &&
        !location.pathname.includes(NAVIGATION_PATHS.viewer) && <Header />}
      <ToastContainer
        position='top-right'
        autoClose={2500}
        pauseOnHover={false}
        theme={'dark'}
      />
      {showLoader && <Loader />}
      <Outlet />
    </div>
  );
};

export default App;
