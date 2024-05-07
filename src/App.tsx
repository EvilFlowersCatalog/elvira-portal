import { Outlet, useLocation } from 'react-router-dom';
import { NAVIGATION_PATHS } from './utils/interfaces/general/general';
import { ToastContainer } from 'react-toastify';
import NavbarContainer from './components/header/NavbarContainer';
import Header from './components/header/Header';
import useAppContext from './hooks/contexts/useAppContext';

const App = () => {
  const { isSmallDevice } = useAppContext();
  const location = useLocation();

  return (
    <div className='min-h-screen h-screen w-screen flex bg-white dark:bg-gray text-black dark:text-white overflow-auto'>
      <div className='min-w-64 flex flex-1'>
        <ToastContainer
          position='top-right'
          autoClose={2500}
          pauseOnHover={false}
          theme={'dark'}
        />

        {!location.pathname.includes(NAVIGATION_PATHS.notFound) &&
          !location.pathname.includes(NAVIGATION_PATHS.viewer) && (
            <NavbarContainer />
          )}

        <div
          className={`${
            isSmallDevice ? 'pt-14' : 'pt-0'
          } flex flex-1 flex-col overflow-auto`}
        >
          {isSmallDevice && <Header />}
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default App;
