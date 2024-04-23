import { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import useApp from '../../../hooks/useAppContext';
import useAuth from '../../../hooks/useAuthContext';
import { useLocation } from 'react-router-dom';
import useVerifyAdmin from '../../../hooks/api/verify/useVerifyAdmin';
import {
  LANG_TYPE,
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../../../utils/interfaces/general/general';
import logoLight from '../../../assets/images/elvira-logo/logo-light.png';
import titleLight from '../../../assets/images/elvira-logo/title-light.png';
import stuLogoLight from '../../../assets/images/stu/stu-logo-light.png';
import stuTitleLight from '../../../assets/images/stu/title/stu-title-light.png';
import { IoBook, IoLibrary } from 'react-icons/io5';
import {
  MdAdminPanelSettings,
  MdFeed,
  MdLanguage,
  MdOutlineHistoryToggleOff,
} from 'react-icons/md';
import { FaHome, FaMoon, FaSearch } from 'react-icons/fa';
import { BiSolidLogOutCircle, BiSolidSun } from 'react-icons/bi';

interface INavButtonParams {
  icon: any;
  specification: any;
  onClick?: any;
  active: boolean;
}

/**
 * Return NavbarButton
 * @param {INavButtonParams}
 * @returns Custom navbar button
 */
const NavbarButton = ({
  icon,
  specification,
  active,
  onClick,
}: INavButtonParams) => {
  return (
    <button
      className={`w-full flex gap-2 items-center min-h-12 hover:border-r-4 hover:border-STUColor ${
        active ? 'bg-STUColor border-r-STUColor text-white' : 'text-white'
      }`}
      onClick={onClick}
    >
      <div className={'flex w-16 justify-center items-center'}>{icon}</div>
      <span className={'text-lg text-nowrap'}>{specification}</span>
    </button>
  );
};

interface INavbarMenuParams {
  isMobile?: boolean;
  setOpen?: (open: boolean) => void;
}

/**
 * NavbarButtons
 * @returns navbar menu for navbar/navbar mobile
 */
const NavbarMenu = ({ isMobile = false, setOpen }: INavbarMenuParams) => {
  const { specialNavigation, updateTheme, updateLang, theme, lang } = useApp();
  const { auth, updateAuth, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const verifyAdmin = useVerifyAdmin();

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

  // Function for cloasing menu when on mobile device
  const closeMenu = () => {
    setOpen && setOpen(false);
  };

  const handleAdminButton = async (event: MouseEvent<HTMLButtonElement>) => {
    try {
      // Get verification
      const isSuperUser = await verifyAdmin();

      // Update auth
      updateAuth({ isSuperUser });

      // If admin navigate
      if (isSuperUser) {
        specialNavigation(event, NAVIGATION_PATHS.adminHome);
        closeMenu();
      }
    } catch {
      logout();
    }
  };
  return (
    <nav className={'h-full'}>
      <ul className={`flex flex-col h-full ${isMobile ? 'w-full' : 'w-64'}`}>
        {!isMobile && (
          <>
            {/* Elvira (home) button */}
            <NavbarButton
              icon={<img className={'w-10'} src={logoLight} />}
              specification={<img className={'w-28'} src={titleLight} />}
              onClick={
                auth
                  ? (e: MouseEvent<HTMLButtonElement>) => {
                      specialNavigation(e, NAVIGATION_PATHS.home);
                      closeMenu();
                    }
                  : undefined
              }
              active={false}
            />
            {/* Stu button */}
            <NavbarButton
              icon={<img className={'w-8'} src={stuLogoLight} />}
              specification={<img className={'w-8'} src={stuTitleLight} />}
              onClick={() =>
                window.open('https://www.fiit.stuba.sk/', '_blank')
              }
              active={false}
            />

            {/* Spacer */}
            <span className='min-h-12'></span>
          </>
        )}

        {/* Home button */}
        {auth && (
          <>
            <NavbarButton
              icon={<FaHome size={26} />}
              specification={t('navbarMenu.home')}
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                specialNavigation(e, NAVIGATION_PATHS.home);
                closeMenu();
              }}
              active={location.pathname === NAVIGATION_PATHS.home}
            />

            {/* Library button */}
            <NavbarButton
              icon={<IoBook size={24} />}
              specification={t('navbarMenu.library')}
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                specialNavigation(e, NAVIGATION_PATHS.library);
                closeMenu();
              }}
              active={location.pathname === NAVIGATION_PATHS.library}
            />

            {/* My Shelf button */}
            <NavbarButton
              icon={<IoLibrary size={22} />}
              specification={t('navbarMenu.myShelf')}
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                specialNavigation(e, NAVIGATION_PATHS.myShelf);
                closeMenu();
              }}
              active={location.pathname === NAVIGATION_PATHS.myShelf}
            />

            {/* Loans history */}
            <NavbarButton
              icon={<MdOutlineHistoryToggleOff size={30} />}
              specification={t('navbarMenu.loanHistory')}
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                specialNavigation(e, NAVIGATION_PATHS.loansHistory);
                closeMenu();
              }}
              active={location.pathname === NAVIGATION_PATHS.loansHistory}
            />

            {/* Feed button */}
            <NavbarButton
              icon={<MdFeed size={28} />}
              specification={t('navbarMenu.feeds')}
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                specialNavigation(e, NAVIGATION_PATHS.feeds);
                closeMenu();
              }}
              active={location.pathname === NAVIGATION_PATHS.feeds}
            />

            {/* Advanced Search button */}
            <NavbarButton
              icon={<FaSearch size={24} />}
              specification={t('navbarMenu.advancedSearch')}
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                specialNavigation(e, NAVIGATION_PATHS.advancedSearch);
                closeMenu();
              }}
              active={location.pathname === NAVIGATION_PATHS.advancedSearch}
            />

            {/* AMDIN */}
            {auth.isSuperUser && (
              <NavbarButton
                icon={<MdAdminPanelSettings size={30} />}
                specification={t('navbarMenu.administration')}
                onClick={handleAdminButton}
                active={location.pathname.includes('admin')}
              />
            )}
          </>
        )}

        {/* SPACER */}
        <span className={'flex-1'}></span>

        {/* Language button */}
        <NavbarButton
          icon={<MdLanguage size={29} />}
          specification={lang === LANG_TYPE.sk ? 'SK' : 'EN'}
          onClick={() => switchLang()}
          active={false}
        />

        {/* Theme button */}
        <NavbarButton
          icon={isDark() ? <FaMoon size={24} /> : <BiSolidSun size={28} />}
          specification={
            isDark() ? t('navbarMenu.darkMode') : t('navbarMenu.lightMode')
          }
          onClick={() => switchTheme()}
          active={false}
        />

        {/* Logout button */}
        {auth && (
          <NavbarButton
            icon={<BiSolidLogOutCircle size={32} />}
            specification={t('navbarMenu.logout')}
            onClick={() => logout()}
            active={false}
          />
        )}
      </ul>
    </nav>
  );
};

export default NavbarMenu;
