import { Outlet, useLocation } from 'react-router-dom';
import { NAVIGATION_PATHS } from './utils/interfaces/general/general';
import { ToastContainer } from 'react-toastify';
import NavbarContainer from './components/header/navbar/NavbarContainer';
import Header from './components/header/Header';
import useAppContext from './hooks/contexts/useAppContext';
import SearchBarContainer from './components/header/search-bar/SearchBarContainer';

const App = () => {
  const { isSmallDevice } = useAppContext();
  const location = useLocation();

  const show = (): boolean => {
    return (
      !location.pathname.includes(NAVIGATION_PATHS.notFound) &&
      !location.pathname.includes(NAVIGATION_PATHS.viewer)
    );
  };

  return (
    <div className='min-h-screen h-screen flex w-screen bg-white dark:bg-gray text-black dark:text-white overflow-auto'>
      <div className='min-w-64 flex flex-1'>
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
          className={`${
            isSmallDevice && show() ? 'pt-14' : 'pt-0'
          } flex flex-1 flex-col overflow-auto`}
        >
          <Outlet />
        </div>

        <SearchBarContainer />
      </div>
    </div>
  );
};

export default App;
