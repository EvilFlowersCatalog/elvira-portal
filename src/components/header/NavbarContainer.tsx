import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import useAppContext from '../../hooks/contexts/useAppContext';
import { IoMdClose } from 'react-icons/io';

const NavbarContainer = () => {
  const { isSmallDevice, showMenu, setShowMenu } = useAppContext();

  return isSmallDevice ? (
    showMenu && (
      <div className='fixed flex w-full h-full bg-gray bg-opacity-50 dark:bg-opacity-80 z-50 overflow-auto'>
        <Navbar />
        <div onClick={() => setShowMenu(false)} className='flex-1'></div>
      </div>
    )
  ) : (
    <Navbar />
  );
};

export default NavbarContainer;
