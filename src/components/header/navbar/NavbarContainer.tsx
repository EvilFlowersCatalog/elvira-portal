import Navbar from './Navbar';
import useAppContext from '../../../hooks/contexts/useAppContext';

const NavbarContainer = () => {
  const { isSmallDevice, showNavbar, setShowNavbar } = useAppContext();

  return isSmallDevice ? (
    showNavbar && (
      <div className='fixed flex w-full h-full bg-gray bg-opacity-50 dark:bg-opacity-80 z-50 overflow-auto'>
        <Navbar />
        <div onClick={() => setShowNavbar(false)} className='flex-1'></div>
      </div>
    )
  ) : (
    <Navbar />
  );
};

export default NavbarContainer;
