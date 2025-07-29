import useAppContext from '../../../hooks/contexts/useAppContext';
import {
  LANG_TYPE,
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../../../utils/interfaces/general/general';

import { ReactElement } from 'react';
import { IoDocumentsOutline, IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';
import { MdOutlineFeed } from 'react-icons/md';
import { RiAdminLine, RiArrowLeftDoubleFill } from 'react-icons/ri';
import { PiBooks } from 'react-icons/pi';
import { HiOutlineLanguage } from 'react-icons/hi2';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { FiBookOpen, FiLogOut } from 'react-icons/fi';
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
  const { specialNavigation, stuBorder, umamiTrack } = useAppContext();

  return (
    <button
      className={`flex w-full gap-2 items-center px-5 py-1 rounded-md ${isActive
          ? 'bg-primaryLight dark:bg-primary text-primary dark:text-primaryLight'
          : 'bg-zinc-100 dark:dark:bg-zinc-800'
        } hover:bg-zinc-200 dark:hover:bg-strongDarkGray hover:text-black dark:hover:text-white`}
      onClick={
        onClick
          ? (e) => onClick(e)
          : (e) => {
            umamiTrack('Navbar Navigation Button', { path });
            specialNavigation(e, path);
          }
      }
    >
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
    umamiTrack,
  } = useAppContext();
  const { auth, logout } = useAuthContext();
  const { stuBg } = useAppContext();

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
    const wantedTheme = isDark() ? THEME_TYPE.light : THEME_TYPE.dark;
    umamiTrack('Theme Button', {
      theme: wantedTheme,
    });
    updateTheme(wantedTheme);
  };

  // Function for switching lang and pathing the app state
  const switchLang = () => {
    const wantedLang = lang === LANG_TYPE.sk ? LANG_TYPE.en : LANG_TYPE.sk;
    umamiTrack('Language Button', {
      lang: wantedLang,
    });
    updateLang(wantedLang);
  };

  return (
    <div className='flex flex-col gap-6 w-64 h-full bg-zinc-100 dark:bg-zinc-800 pt-8 pb-3 px-5 overflow-auto'>
      {/* Logos */}
      <div className='flex justify-between items-center'>
        <button
          className={auth ? 'cursor-pointer' : 'cursor-default'}
          onClick={
            auth
              ? (e) => {
                umamiTrack('Logo Home Button');
                specialNavigation(e, NAVIGATION_PATHS.home);
              }
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
            className={`${stuBg} h-full flex items-center text-white w-fit rounded-md px-1`}
            onClick={() => setShowNavbar(false)}
          >
            <RiArrowLeftDoubleFill size={18} />
          </button>
        )}
      </div>

      {/* Portal container */}
      {auth && (
        <div className='flex gap-2 flex-col items-start'>
          <span className='font-bold uppercase font-medium'>{t('navbarMenu.portal')}</span>
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
          {/* <NavbarButton
            name={t('navbarMenu.about')}
            path={NAVIGATION_PATHS.about}
            icon={<FiHelpCircle size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.about}
          /> */}
          {auth.isSuperUser && (
            <NavbarButton
              name={t('navbarMenu.administration')}
              path={NAVIGATION_PATHS.adminHome}
              icon={<RiAdminLine size={23} />}
              isActive={location.pathname.includes('administration')}
              onClick={(e) => {
                const path = NAVIGATION_PATHS.adminHome;
                umamiTrack('Navbar Navigation Button', {
                  path,
                });
                specialNavigation(e, path);
              }}
            />
          )}
        </div>
      )}

      {/* Personal container */}
      {auth && (
        <div className='flex gap-2 flex-col items-start'>
          <span className='font-bold mb-3 uppercase font-medium'>{t('navbarMenu.personal')}</span>
          <NavbarButton
            name={t('navbarMenu.myShelf')}
            path={NAVIGATION_PATHS.shelf}
            icon={<PiBooks size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.shelf}
          />
          <NavbarButton
            name={t('navbarMenu.loan')}
            path={NAVIGATION_PATHS.loans}
            icon={<IoDocumentsOutline size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.loans}
          />
        </div>
      )}

      {/* Settings container */}
      <div className='flex flex-col items-start'>
        <span className='font-bold mb-3 uppercase font-medium'>{t('navbarMenu.settings')}</span>
        <NavbarButton
          name={isDark() ? t('navbarMenu.lightMode') : t('navbarMenu.darkMode')}
          path=''
          onClick={switchTheme}
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
          onClick={switchLang}
          path=''
          icon={<HiOutlineLanguage size={23} />}
          isActive={false}
        />
      </div>

      {/* Logout */}
      {auth && (
        <>
          <div className='flex flex px-4 py-2 mt-auto items-center gap-2 rounded-lg bg-slate-200 dark:bg-darkGray'>
            <Gravatar
              email={`${auth.username}@stuba.sk`}
              size={30}
              className='rounded-full'
              default='monsterid'
            />
            <div className='flex flex-col items-start'>
              <p className='text-[12px] font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px]'>
                {auth.name} {auth.surname}
              </p>
              <p className='text-[10px] font-medium shrink-0'>
                {auth.isSuperUser ? t('navbarMenu.superUser') : t('navbarMenu.user')}
              </p>
            </div>
            <Button
              onClick={() => {
                umamiTrack('Logout Button');
                logout();
              }} className='bg-transparent text-black dark:text-white ml-auto hover:text-white p-2'><FiLogOut/></Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;
