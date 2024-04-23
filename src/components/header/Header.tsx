import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import MobileNavbar from './MobileNavbar';
import SearchMenu from './menu/SearchMenu';
import useAppContext from '../../hooks/useAppContext';

/**
 * Returns Header
 * @returns mobile header or normal header (navbar) base on isMobile value true/false
 */
const Header = () => {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 599);
  const { isSearchNeeded } = useAppContext();

  useEffect(() => {
    // handle resizeing window and set height/width
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setIsMobile(newWidth <= 598);
    };

    // Attach the event listener when the component mounts
    window.addEventListener('resize', handleResize);
    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isMobile ? (
    <MobileNavbar />
  ) : (
    <>
      <Navbar />
      {/* Search menu for desktops */}
      {isSearchNeeded() && <SearchMenu showFilterButton />}
    </>
  );
};

export default Header;
