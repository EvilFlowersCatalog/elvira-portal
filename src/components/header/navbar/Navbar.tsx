import { MouseEvent } from 'react';
import useAppContext from '../../../hooks/contexts/useAppContext';
import {
  LANG_TYPE,
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../../../utils/interfaces/general/general';

import { ReactElement } from 'react';
import {
  IoDocumentsOutline,
  IoMoonOutline,
  IoSunnyOutline,
} from 'react-icons/io5';
import { MdOutlineFeed } from 'react-icons/md';
import { RiAdminLine, RiArrowLeftDoubleFill } from 'react-icons/ri';
import { PiBooks } from 'react-icons/pi';
import { HiOutlineLanguage } from 'react-icons/hi2';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { FiBookOpen, FiHelpCircle } from 'react-icons/fi';
import { RxHome } from 'react-icons/rx';
import Gravatar from 'react-gravatar';
import Button from '../../buttons/Button';

interface INavbarButtonParams {
  name: string;
  path?: NAVIGATION_PATHS | '';
  icon: ReactElement;
  isActive: boolean;
  onClick?: ((...args: any) => void) | null;
}
const NavbarButton = ({
  name,
  path = '',
  icon,
  isActive,
  onClick = null,
}: INavbarButtonParams) => {
  const { specialNavigation } = useAppContext();
  return (
    <button
      className={`flex w-full gap-2 items-center pl-3 py-2 rounded-md ${
        isActive
          ? 'bg-zinc-200 dark:bg-strongDarkGray'
          : 'bg-zinc-100 dark:dark:bg-darkGray'
      } hover:bg-zinc-200 dark:hover:bg-strongDarkGray`}
      onClick={onClick ? (e) => onClick(e) : (e) => specialNavigation(e, path)}
    >
      <span
        className={`border-2 h-5/6 ${
          isActive ? 'border-STUColor' : 'border-transparent'
        } rounded-md`}
      />
      {icon}
      {name}
    </button>
  );
};

const Navbar = () => {
  const {
    specialNavigation,
    updateTheme,
    updateLang,
    theme,
    lang,
    isSmallDevice,
    titleLogoDark,
    titleLogoLight,
    setShowNavbar,
    stuLogoDark,
    stuLogoLight,
  } = useAppContext();
  const { auth, logout } = useAuthContext();
  const { t } = useTranslation();
  const location = useLocation();
  const stuLinks: { [key: string]: string } = {
    ['fiit']: 'https://www.fiit.stuba.sk/',
    ['mtf']: 'https://www.mtf.stuba.sk/',
    ['fad']: 'https://www.fad.stuba.sk/',
    ['fchpt']: 'https://www.fchpt.stuba.sk/',
    ['fei']: 'https://www.fei.stuba.sk/',
    ['sjf']: 'https://www.sjf.stuba.sk/',
    ['svf']: 'https://www.svf.stuba.sk/',
  };

  // Function for returning if theme is dark cuz of lot of usage
  const isDark = () => {
    return theme === THEME_TYPE.dark;
  };

  // Function for switching theme and patching the app state
  const switchTheme = () => {
    updateTheme(isDark() ? THEME_TYPE.light : THEME_TYPE.dark);
  };

  // Function for switching lang and pathing the app state
  const switchLang = () => {
    updateLang(lang === LANG_TYPE.sk ? LANG_TYPE.en : LANG_TYPE.sk);
  };

  return (
    <div className='flex flex-col gap-2 w-64 h-full bg-zinc-100 dark:bg-darkGray p-4 overflow-auto'>
      {/* Logos */}
      <div className='flex mb-5 justify-between items-center'>
        <button
          className={auth ? 'cursor-pointer' : 'cursor-default'}
          onClick={
            auth
              ? (e) => specialNavigation(e, NAVIGATION_PATHS.home)
              : undefined
          }
        >
          <img
            className={`h-auto ${isSmallDevice ? 'w-36' : 'w-full'}`}
            src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
            alt='Elvira Logo'
          />
        </button>
        {isSmallDevice && (
          <button
            className='bg-STUColor h-full flex items-center text-white w-fit rounded-md px-1'
            onClick={() => setShowNavbar(false)}
          >
            <RiArrowLeftDoubleFill size={18} />
          </button>
        )}
      </div>

      <div className='flex flex-col items-start'>
        <h1 className='font-bold'>{t('navbarMenu.catalog')}</h1>
        {/* STU Logo */}
        <NavbarButton
          name={''}
          onClick={() =>
            window.open(stuLinks[import.meta.env.ELVIRA_ASSETS_DIR], '_blank')
          }
          icon={
            <img
              className='h-auto w-[70px]'
              src={theme === THEME_TYPE.dark ? stuLogoLight : stuLogoDark}
              alt='STU Logo'
            />
          }
          isActive={false}
        />
      </div>

      {/* Portal container */}
      {auth && (
        <div className='flex flex-col items-start'>
          <h1 className='font-bold'>{t('navbarMenu.portal')}</h1>
          <NavbarButton
            name={t('navbarMenu.home')}
            path={NAVIGATION_PATHS.home}
            icon={<RxHome size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.home}
          />
          <NavbarButton
            name={t('navbarMenu.library')}
            path={NAVIGATION_PATHS.library}
            icon={<FiBookOpen size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.library}
          />
          <NavbarButton
            name={t('navbarMenu.feeds')}
            path={NAVIGATION_PATHS.feeds}
            icon={<MdOutlineFeed size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.feeds}
          />
          <NavbarButton
            name={t('navbarMenu.about')}
            path={NAVIGATION_PATHS.about}
            icon={<FiHelpCircle size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.about}
          />
          {auth.isSuperUser && (
            <NavbarButton
              name={t('navbarMenu.administration')}
              path={NAVIGATION_PATHS.adminHome}
              icon={<RiAdminLine size={23} />}
              isActive={location.pathname.includes('administration')}
              onClick={(e) => specialNavigation(e, NAVIGATION_PATHS.adminHome)}
            />
          )}
        </div>
      )}

      {/* Personal container */}
      {auth && (
        <div className='flex flex-col items-start'>
          <h1 className='font-bold'>{t('navbarMenu.personal')}</h1>
          <NavbarButton
            name={t('navbarMenu.myShelf')}
            path={NAVIGATION_PATHS.shelf}
            icon={<PiBooks size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.shelf}
          />
          {/* <NavbarButton
            name={t('navbarMenu.loan')}
            path={NAVIGATION_PATHS.loans}
            icon={<IoDocumentsOutline size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.loans}
          /> */}
        </div>
      )}

      {/* Settings container */}
      <div className='flex flex-col items-start'>
        <h1 className='font-bold'>{t('navbarMenu.settings')}</h1>
        <NavbarButton
          name={isDark() ? t('navbarMenu.lightMode') : t('navbarMenu.darkMode')}
          path=''
          onClick={() => switchTheme()}
          icon={
            isDark() ? (
              <IoSunnyOutline size={23} />
            ) : (
              <IoMoonOutline size={23} />
            )
          }
          isActive={false}
        />
        <NavbarButton
          name={lang === LANG_TYPE.sk ? 'EN' : 'SK'}
          onClick={() => switchLang()}
          path=''
          icon={<HiOutlineLanguage size={23} />}
          isActive={false}
        />
      </div>

      {/* Spacer */}
      <span className='flex-1 min-h-10'></span>

      {/* Logout */}
      {auth && (
        <>
          <div className='flex flex-col pl-2 items-center justify-center gap-3 text-lg font-extrabold'>
            <Gravatar
              email={`${auth.username}@stuba.sk`}
              size={80}
              className='rounded-full'
              default='monsterid'
            />
            {auth.username}
            <Button onClick={logout} title={t('navbarMenu.logout')} />
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;
