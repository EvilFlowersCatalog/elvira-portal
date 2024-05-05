import { MouseEvent } from 'react';
import titleLogoDark from '../../assets/images/elvira-logo/title-logo-dark.png';
import titleLogoLight from '../../assets/images/elvira-logo/title-logo-light.png';
import stuTitleDark from '../../assets/images/stu/title/stu-title-dark.png';
import stuTitleLight from '../../assets/images/stu/title/stu-title-light.png';
import useAppContext from '../../hooks/contexts/useAppContext';
import {
  LANG_TYPE,
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../../utils/interfaces/general/general';

import { ReactElement } from 'react';
import {
  IoBookOutline,
  IoDocumentsOutline,
  IoMoonOutline,
  IoSearchOutline,
  IoSunnyOutline,
} from 'react-icons/io5';
import { MdOutlineGroupWork, MdOutlineHistoryToggleOff } from 'react-icons/md';
import { CiLogout } from 'react-icons/ci';
import { RiAdminLine, RiArrowLeftDoubleFill } from 'react-icons/ri';
import { GoHome } from 'react-icons/go';
import { PiBooksLight } from 'react-icons/pi';
import { HiOutlineLanguage } from 'react-icons/hi2';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import useVerifyAdmin from '../../hooks/api/verify/useVerifyAdmin';
import { FiHelpCircle } from 'react-icons/fi';

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
    setShowMenu,
  } = useAppContext();
  const { auth, updateAuth, logout } = useAuthContext();
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

  const handleAdminButton = async (
    event: MouseEvent<HTMLButtonElement>,
    path: NAVIGATION_PATHS
  ) => {
    try {
      // Get verification
      const isSuperUser = await verifyAdmin();

      // Update auth
      updateAuth({ isSuperUser });

      // If admin navigate
      if (isSuperUser) specialNavigation(event, path);
    } catch {
      logout();
    }
  };

  return (
    <div className='flex flex-col gap-2 w-64 min-w-64 h-full bg-zinc-100 dark:bg-darkGray p-4 overflow-auto'>
      {/* Logos */}
      <div className='flex h-6 mb-5 justify-between'>
        <button onClick={(e) => specialNavigation(e, NAVIGATION_PATHS.home)}>
          <img
            className='h-full w-auto'
            src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
          />
        </button>
        {isSmallDevice ? (
          <button
            className='bg-STUColor h-full flex items-center text-white w-fit rounded-md p-1 mb-2'
            onClick={() => setShowMenu(false)}
          >
            <RiArrowLeftDoubleFill size={18} />
          </button>
        ) : (
          <img
            className='h-full w-auto'
            src={theme === THEME_TYPE.dark ? stuTitleLight : stuTitleDark}
          />
        )}
      </div>

      {/* Portal container */}
      {auth && (
        <div className='flex flex-col items-start'>
          <h1 className='font-bold'>{t('navbarMenu.portal')}</h1>
          <NavbarButton
            name={t('navbarMenu.home')}
            path={NAVIGATION_PATHS.home}
            icon={<GoHome size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.home}
          />
          <NavbarButton
            name={t('navbarMenu.library')}
            path={NAVIGATION_PATHS.library}
            icon={<IoBookOutline size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.library}
          />
          <NavbarButton
            name={t('navbarMenu.feeds')}
            path={NAVIGATION_PATHS.feeds}
            icon={<MdOutlineGroupWork size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.feeds}
          />
          <NavbarButton
            name={t('navbarMenu.advancedSearch')}
            path={NAVIGATION_PATHS.advancedSearch}
            icon={<IoSearchOutline size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.advancedSearch}
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
              onClick={(e) => handleAdminButton(e, NAVIGATION_PATHS.adminHome)}
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
            icon={<PiBooksLight size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.shelf}
          />
          <NavbarButton
            name={t('navbarMenu.loan')}
            path={NAVIGATION_PATHS.loans}
            icon={<IoDocumentsOutline size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.loans}
          />
          <NavbarButton
            name={t('navbarMenu.loanHistory')}
            path={NAVIGATION_PATHS.loansHistory}
            icon={<MdOutlineHistoryToggleOff size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.loansHistory}
          />
        </div>
      )}

      {/* Settings container */}
      <div className='flex flex-col items-start'>
        <h1 className='font-bold'>{t('navbarMenu.settings')}</h1>
        <NavbarButton
          name={isDark() ? t('navbarMenu.darkMode') : t('navbarMenu.lightMode')}
          path=''
          onClick={() => switchTheme()}
          icon={
            isDark() ? (
              <IoMoonOutline size={23} />
            ) : (
              <IoSunnyOutline size={23} />
            )
          }
          isActive={false}
        />
        <NavbarButton
          name={lang === LANG_TYPE.sk ? 'SK' : 'EN'}
          onClick={() => switchLang()}
          path=''
          icon={<HiOutlineLanguage size={23} />}
          isActive={false}
        />
      </div>

      {/* Spacer */}
      <span className='flex-1'></span>

      {/* Logout */}
      {auth && (
        <button
          className={`flex w-full gap-2 items-center pl-2 py-1 rounded-md bg-zinc-100 dark:dark:bg-darkGray hover:bg-zinc-200 dark:hover:bg-strongDarkGray`}
          onClick={logout}
        >
          <CiLogout size={23} />
          {t('navbarMenu.logout')}
        </button>
      )}
    </div>
  );
};

export default Navbar;
