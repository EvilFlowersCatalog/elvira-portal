import useAppContext from "../../../hooks/contexts/useAppContext";
import {
  LANG_TYPE,
  NAVIGATION_PATHS,
  THEME_TYPE,
} from "../../../utils/interfaces/general/general";

import { ReactElement, useState } from "react";
import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";
import {
  RiAdminLine,
  RiAiGenerate,
  RiArrowLeftDoubleFill,
} from "react-icons/ri";
import useAuthContext from "../../../hooks/contexts/useAuthContext";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import Gravatar from "react-gravatar";
import Button from "../../buttons/Button";
import {
  HomeIcon,
  LibraryIcon,
  FeedsIcon,
  BookmarkIcon,
  ClockIcon,
  LoansIcon,
  LanguageIcon,
  HelpIcon,
} from "./NavbarIcons";

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
      className={`text-sm flex gap-2 items-center ${textVisible ? 'px-4 w-full' : 'px-2 justify-center w-fit mx-auto'} py-1 rounded-md ${
        isActive
          ? "bg-primaryLight text-primary"
          : "bg-zinc-100 dark:dark:bg-zinc-800"
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

  const toggleNavbar = () => {
    setIsCollapsed(!isCollapsed);
    if (isSmallDevice) {
      setShowNavbar(!showNavbar);
    }
  };
  
  return (
    <div className={`${isCollapsed ? 'w-20' : 'lg:w-64 w-full'} h-screen bg-zinc-100 dark:bg-zinc-800 pt-4 ${isCollapsed ? 'px-3' : 'px-5'} flex flex-col transition-all duration-300`}>
        {/* Logos */}
        <div className="flex mb-6 flex-shrink-0">
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
                className={`h-full flex items-center text-gray w-fit rounded-md px-1 ml-auto`}
                onClick={toggleNavbar}
              >
                <RiArrowLeftDoubleFill size={18} />
              </button>
            </>
          ) : (
            <button
              className="flex items-center w-7 h-7 justify-center bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white rounded-md mx-auto"
              onClick={toggleNavbar}
            >
              <RiArrowLeftDoubleFill size={18} className="rotate-180" />
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
            ) : (
              <div className="w-full h-[1px] bg-zinc-300 dark:bg-zinc-600" />
            )}
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
              name={t("navbarMenu.aiAssistant")}
              path={NAVIGATION_PATHS.aiChatHistory}
              icon={<RiAiGenerate size={20} />}
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
                icon={<RiAdminLine size={20} />}
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
            <NavbarButton
              name={t("navbarMenu.history")}
              path={NAVIGATION_PATHS.history}
              icon={<ClockIcon size={20} />}
              isActive={location.pathname === NAVIGATION_PATHS.history}
              textVisible={!isCollapsed}
            />
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
          <NavbarButton
            name={t("navbarMenu.help")}
            path={NAVIGATION_PATHS.help}
            icon={<HelpIcon size={20} />}
            isActive={false}
            textVisible={!isCollapsed}
          />
        </div>
      </div>
      {/* Logout */}
      {auth && (
        <div className="relative w-full pb-4 pt-2">
          {!isCollapsed ? (
            <div className="w-full flex py-2 mt-auto items-center gap-2 rounded-lg px-3 bg-slate-200 dark:bg-darkGray">
              <Gravatar
                email={`${auth.username}@stuba.sk`}
                size={30}
                className="rounded-full"
                default="monsterid"
              />
              <div className="flex flex-col items-start">
                <p className="text-[12px] font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px]">
                  {auth.name} {auth.surname}
                </p>
                <p className="text-[10px] font-medium shrink-0">
                  {auth.isSuperUser
                    ? t("navbarMenu.superUser")
                    : t("navbarMenu.user")}
                </p>
              </div>
              <Button
                onClick={() => {
                  umamiTrack("Logout Button");
                  logout();
                }}
                className="bg-transparent text-black dark:text-white ml-auto hover:text-white p-2"
              >
                <FiLogOut />
              </Button>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-2 items-center">
              <Button
                onClick={() => {
                  umamiTrack("Logout Button");
                  logout();
                }}
                className="bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-600 p-2 rounded-md"
              >
                <FiLogOut size={20} />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Navbar;
