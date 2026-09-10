import useAppContext from "../../../hooks/contexts/useAppContext";
import {
  LANG_TYPE,
  NAVIGATION_PATHS,
  THEME_TYPE,
} from "../../../utils/interfaces/general/general";

import {
  RiAdminLine,
  RiAiGenerate,
  RiArrowLeftDoubleFill,
} from "react-icons/ri";
import {
  HomeIcon,
  LibraryIcon,
  FeedsIcon,
  CategoriesIcon,
  BookmarkIcon,
  ClockIcon,
  LoansIcon,
  LanguageIcon,
  HelpIcon,
  AdministrationIcon,
  ChatIcon,
} from "./NavbarIcons";
import useAuthContext from "../../../hooks/contexts/useAuthContext";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { FiLogOut, FiUser } from "react-icons/fi";
import Gravatar from "react-gravatar";
import Button from "../../buttons/Button";
import { ReactElement, useEffect, useRef, useState } from "react";
import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";

interface INavbarButtonParams {
  name: string;
  path?: NAVIGATION_PATHS | "";
  icon: ReactElement;
  isActive: boolean;
  onClick?: ((...args: any) => void) | null;
  textVisible?: boolean;
}
const NavbarButton = ({
  name,
  path = "",
  icon,
  isActive,
  onClick = null,
  textVisible = true,
}: INavbarButtonParams) => {
  const { specialNavigation, umamiTrack } = useAppContext();

  return (
    <button
      className={`text-sm flex gap-2 items-center ${textVisible ? "px-4 w-full" : "px-2 justify-center w-fit mx-auto"} py-1 rounded-md ${
        isActive
          ? "bg-primaryLight text-primary"
          : "bg-white dark:dark:bg-zinc-800"
      } hover:bg-zinc-200 dark:hover:bg-strongDarkGray hover:text-black dark:hover:text-white`}
      onClick={
        onClick
          ? (e) => onClick(e)
          : (e) => {
              umamiTrack("Navbar Navigation Button", { path });
              specialNavigation(e, path);
            }
      }
    >
      {icon}
      {textVisible && name}
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
    showNavbar,
    setShowAiAssistant,
    umamiTrack,
  } = useAppContext();
  const { auth, logout } = useAuthContext();

  const { t } = useTranslation();
  const location = useLocation();
  const stuLinks: { [key: string]: string } = {
    ["fiit"]: "https://www.fiit.stuba.sk/",
    ["mtf"]: "https://www.mtf.stuba.sk/",
    ["fad"]: "https://www.fad.stuba.sk/",
    ["fchpt"]: "https://www.fchpt.stuba.sk/",
    ["fei"]: "https://www.fei.stuba.sk/",
    ["sjf"]: "https://www.sjf.stuba.sk/",
    ["svf"]: "https://www.svf.stuba.sk/",
    ["ku"]: "https://www.ku.sk/",
  };

  // Function for returning if theme is dark cuz of lot of usage
  const isDark = () => {
    return theme === THEME_TYPE.dark;
  };

  // Function for switching theme and patching the app state
  const switchTheme = () => {
    const wantedTheme = isDark() ? THEME_TYPE.light : THEME_TYPE.dark;
    umamiTrack("Theme Button", {
      theme: wantedTheme,
    });
    updateTheme(wantedTheme);
  };

  // Function for switching lang and pathing the app state
  const switchLang = () => {
    const wantedLang = lang === LANG_TYPE.sk ? LANG_TYPE.en : LANG_TYPE.sk;
    umamiTrack("Language Button", {
      lang: wantedLang,
    });
    updateLang(wantedLang);
  };

  const [isCollapsed, setIsCollapsed] = useState(!isSmallDevice);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleNavbar = () => {
    setIsCollapsed(!isCollapsed);
    if (isSmallDevice) {
      setShowNavbar(!showNavbar);
    }
  };

  return (
    <div
      className={`${isCollapsed ? "w-20 nav_collapsed" : "lg:w-64 w-full"} h-screen bg-white dark:bg-zinc-800 pt-4 ${isCollapsed ? "px-3" : "px-5"} flex flex-col transition-all duration-300`}
    >
      {/* Logos */}
      <div className="flex mb-4 flex-shrink-0">
        {!isCollapsed ? (
          <>
            <button
              className={auth ? "cursor-pointer" : "cursor-default"}
              onClick={
                auth
                  ? (e) => {
                      umamiTrack("Logo Home Button");
                      specialNavigation(e, NAVIGATION_PATHS.home);
                    }
                  : undefined
              }
            >
              <img
                className={`h-auto w-36`}
                src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
                alt="Elvira Logo"
              />
            </button>
            <button
              aria-label={t('navbar.collapse', { defaultValue: 'Collapse sidebar' })}
              className={`h-full flex items-center text-gray w-fit rounded-md px-1 ml-auto`}
              onClick={toggleNavbar}
            >
              <RiArrowLeftDoubleFill size={18} aria-hidden="true" />
            </button>
          </>
        ) : (
          <button
            aria-label={t('navbar.expand', { defaultValue: 'Expand sidebar' })}
            className="flex items-center w-7 h-7 justify-center bg-zinc-100 dark:bg-zinc-700 text-black dark:text-white rounded-md mx-auto"
            onClick={toggleNavbar}
          >
            <RiArrowLeftDoubleFill size={18} className="rotate-180" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6 overflow-auto flex-1">
        {/* Portal container */}
        {auth && (
          <div className="flex gap-3 flex-col items-start">
            {!isCollapsed ? (
              <span className="font-[500] uppercase text-sm">
                {t("navbarMenu.portal")}
              </span>
            ) : null }
            <NavbarButton
              name={t("navbarMenu.home")}
              path={NAVIGATION_PATHS.home}
              icon={<HomeIcon size={20} />}
              isActive={location.pathname === NAVIGATION_PATHS.home}
              textVisible={!isCollapsed}
            />
            <NavbarButton
              name={t("navbarMenu.library")}
              path={NAVIGATION_PATHS.library}
              icon={<LibraryIcon size={20} />}
              isActive={location.pathname === NAVIGATION_PATHS.library}
              textVisible={!isCollapsed}
            />
            <NavbarButton
              name={t("navbarMenu.feeds")}
              path={NAVIGATION_PATHS.feeds}
              icon={<FeedsIcon size={20} />}
              isActive={location.pathname === NAVIGATION_PATHS.feeds}
              textVisible={!isCollapsed}
            />
            <NavbarButton
              name={t("navbarMenu.categories")}
              path={NAVIGATION_PATHS.categories}
              icon={<CategoriesIcon size={20} />}
              isActive={location.pathname === NAVIGATION_PATHS.categories}
              textVisible={!isCollapsed}
            />
            <NavbarButton
              name={t("navbarMenu.aiAssistant")}
              path={NAVIGATION_PATHS.aiChatHistory}
              icon={<ChatIcon size={20} />}
              isActive={
                location.pathname === NAVIGATION_PATHS.aiAssistant ||
                location.pathname === NAVIGATION_PATHS.aiChatHistory
              }
              textVisible={!isCollapsed}
            />
            {/* <NavbarButton
            name={t('navbarMenu.about')}
            path={NAVIGATION_PATHS.about}
            icon={<FiHelpCircle size={20} />}
            isActive={location.pathname === NAVIGATION_PATHS.about}
          /> */}
            {auth.isSuperUser && (
              <NavbarButton
                name={t("navbarMenu.administration")}
                path={NAVIGATION_PATHS.adminHome}
                icon={<AdministrationIcon size={20} />}
                isActive={location.pathname.includes("administration")}
                textVisible={!isCollapsed}
                onClick={(e) => {
                  const path = NAVIGATION_PATHS.adminHome;
                  umamiTrack("Navbar Navigation Button", {
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
          <div className="flex gap-3 flex-col items-start">
            {!isCollapsed ? (
              <span className="font-[500] uppercase text-sm">
                {t("navbarMenu.personal")}
              </span>
            ) : (
              <div className="w-full h-[1px] bg-zinc-300 dark:bg-zinc-600" />
            )}
            <NavbarButton
              name={t("navbarMenu.myShelf")}
              path={NAVIGATION_PATHS.shelf}
              icon={<BookmarkIcon size={20} />}
              isActive={location.pathname === NAVIGATION_PATHS.shelf}
              textVisible={!isCollapsed}
            />
            {import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === "true" && (
            <NavbarButton
              name={t("navbarMenu.history")}
              path={NAVIGATION_PATHS.history}
              icon={<ClockIcon size={20} />}
              isActive={location.pathname === NAVIGATION_PATHS.history}
              textVisible={!isCollapsed}
            />)}
            {import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === "true" && (
              <NavbarButton
                name={t("navbarMenu.loan")}
                path={NAVIGATION_PATHS.loans}
                icon={<LoansIcon size={20} />}
                isActive={location.pathname === NAVIGATION_PATHS.loans}
                textVisible={!isCollapsed}
              />
            )}
          </div>
        )}

        {/* Settings container */}
        <div className="flex gap-3 flex-col items-start">
          {!isCollapsed ? (
            <span className="font-[500] uppercase text-sm">
              {t("navbarMenu.settings")}
            </span>
          ) : (
            <div className="w-full h-[1px] bg-zinc-300 dark:bg-zinc-600" />
          )}
          <NavbarButton
            name={lang === LANG_TYPE.sk ? "EN" : "SK"}
            onClick={switchLang}
            path=""
            icon={<LanguageIcon size={20} />}
            isActive={false}
            textVisible={!isCollapsed}
          />
          <NavbarButton
            name={
              isDark() ? t("navbarMenu.lightMode") : t("navbarMenu.darkMode")
            }
            path=""
            onClick={switchTheme}
            icon={
              isDark() ? (
                <IoSunnyOutline size={20} />
              ) : (
                <IoMoonOutline size={20} />
              )
            }
            isActive={false}
            textVisible={!isCollapsed}
          />
          { import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === "true" && (
          <NavbarButton
            name={t("navbarMenu.help")}
            path={NAVIGATION_PATHS.help}
            icon={<HelpIcon size={20} />}
            isActive={false}
            textVisible={!isCollapsed}
          />)}
        </div>
      </div>
      {/* Profile */}
      {auth && (
        <div className="relative w-full pb-4 pt-2" ref={profileRef}>
          {profileDropdownOpen && (
            <div className="absolute bottom-full mb-2 left-0 w-[162px] bg-lightGray dark:bg-zinc-800 rounded-lg shadow-[0px_2px_2.5px_rgba(0,0,0,0.25)] border border-[#e5e5e5] dark:border-zinc-700 overflow-hidden z-50">
              <button
                className="w-full flex items-center gap-3 px-4 h-8 text-secondary dark:text-white text-[12px] font-medium hover:brightness-95 dark:hover:bg-zinc-700 text-left"
                onClick={(e) => {
                  umamiTrack("Profile Button");
                  specialNavigation(e, NAVIGATION_PATHS.profile);
                  setProfileDropdownOpen(false);
                }}
              >
                <FiUser size={15} />
                {t("navbarMenu.profile")}
              </button>
              <div className="w-full h-px bg-[#e5e5e5] dark:bg-zinc-700" />
              <button
                className="w-full flex items-center gap-3 px-4 h-8 text-primary text-[12px] font-medium hover:brightness-95 dark:hover:bg-zinc-700 text-left"
                onClick={() => {
                  umamiTrack("Logout Button");
                  logout();
                  setProfileDropdownOpen(false);
                }}
              >
                <FiLogOut size={15} />
                {t("navbarMenu.logout")}
              </button>
            </div>
          )}
          {!isCollapsed ? (
            <button
              className="w-full flex h-10 items-center gap-3 rounded-lg px-3 bg-lightGray dark:bg-darkGray shadow-[0px_4px_6px_rgba(0,0,0,0.1)] hover:brightness-95 dark:hover:brightness-110 transition-all"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <Gravatar
                email={`${auth.username}@stuba.sk`}
                size={28}
                className="rounded-full shrink-0"
                default="monsterid"
              />
              <div className="flex flex-col items-start overflow-hidden">
                <p className="text-[12px] font-medium overflow-hidden text-ellipsis whitespace-nowrap w-full">
                  {auth.username}
                </p>
                <p className="text-[9px] font-light shrink-0">
                  {auth.isSuperUser
                    ? t("navbarMenu.superUser")
                    : t("navbarMenu.user")}
                </p>
              </div>
            </button>
          ) : (
            <div className="w-full flex justify-center">
              <button
                className="flex items-center justify-center w-11 h-10 bg-lightGray dark:bg-zinc-700 shadow-[0px_4px_6px_rgba(0,0,0,0.1)] rounded-lg hover:brightness-95 dark:hover:brightness-110 transition-all"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <Gravatar
                  email={`${auth.username}@stuba.sk`}
                  size={28}
                  className="rounded-full"
                  default="monsterid"
                />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Navbar;
