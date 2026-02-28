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
import { FiLogOut } from "react-icons/fi";
import Gravatar from "react-gravatar";
import Button from "../../buttons/Button";
import { MenuItem, Select } from "@mui/material";
import { CatalogSelectStyle } from "../../inputs/ElviraSelect";
import {
  CATALOG_ICON_MAP,
  DEFAULT_CATALOG_ICON,
} from "../../../utils/catalogIcons";
import { ReactElement, useState } from "react";
import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";

function StuDots({ color }: { color: string }) {
  return (
    <svg
      width="19"
      height="13"
      viewBox="0 0 38 27"
      fill="none"
      className="shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.04427 15.321C3.17093 15.321 4.08853 14.4053 4.08853 13.273C4.08853 12.1429 3.17093 11.2345 2.04427 11.2345C0.913599 11.2345 0 12.1429 0 13.273C0 14.4053 0.913599 15.321 2.04427 15.321Z"
        fill={color}
      />
      <path
        d="M2.04427 26.5486C3.17093 26.5486 4.08853 25.6345 4.08853 24.5069C4.08853 23.3777 3.17093 22.4601 2.04427 22.4601C0.913599 22.4601 0 23.3777 0 24.5069C0 25.6345 0.913599 26.5486 2.04427 26.5486Z"
        fill={color}
      />
      <path
        d="M13.2764 15.321C14.4046 15.321 15.318 14.4053 15.318 13.273C15.318 12.1429 14.4046 11.2345 13.2764 11.2345C12.1456 11.2345 11.2295 12.1429 11.2295 13.273C11.2295 14.4053 12.1456 15.321 13.2764 15.321Z"
        fill={color}
      />
      <path
        d="M13.2764 26.5486C14.4046 26.5486 15.318 25.6345 15.318 24.5069C15.318 23.3777 14.4046 22.4601 13.2764 22.4601C12.1456 22.4601 11.2295 23.3777 11.2295 24.5069C11.2295 25.6345 12.1456 26.5486 13.2764 26.5486Z"
        fill={color}
      />
      <path
        d="M24.5021 15.321C25.6355 15.321 26.5491 14.4053 26.5491 13.273C26.5491 12.1429 25.6355 11.2345 24.5021 11.2345C23.3715 11.2345 22.4609 12.1429 22.4609 13.273C22.4609 14.4053 23.3715 15.321 24.5021 15.321Z"
        fill={color}
      />
      <path
        d="M2.04427 4.08716C3.17093 4.08716 4.08853 3.17103 4.08853 2.04436C4.08853 0.913694 3.17093 9.33741e-05 2.04427 9.33741e-05C0.913599 9.33741e-05 0 0.913694 0 2.04436C0 3.17103 0.913599 4.08716 2.04427 4.08716Z"
        fill={color}
      />
      <path
        d="M13.2764 4.08716C14.4046 4.08716 15.318 3.17103 15.318 2.04436C15.318 0.913694 14.4046 9.33741e-05 13.2764 9.33741e-05C12.1456 9.33741e-05 11.2295 0.913694 11.2295 2.04436C11.2295 3.17103 12.1456 4.08716 13.2764 4.08716Z"
        fill={color}
      />
      <path
        d="M24.5021 4.08716C25.6355 4.08716 26.5491 3.17103 26.5491 2.04436C26.5491 0.913694 25.6355 9.33741e-05 24.5021 9.33741e-05C23.3715 9.33741e-05 22.4609 0.913694 22.4609 2.04436C22.4609 3.17103 23.3715 4.08716 24.5021 4.08716Z"
        fill={color}
      />
      <path
        d="M24.5021 26.5486C25.6355 26.5486 26.5491 25.6345 26.5491 24.5069C26.5491 23.3777 25.6355 22.4601 24.5021 22.4601C23.3715 22.4601 22.4609 23.3777 22.4609 24.5069C22.4609 25.6345 23.3715 26.5486 24.5021 26.5486Z"
        fill={color}
      />
      <path
        d="M35.734 15.321C36.8637 15.321 37.7783 14.4053 37.7783 13.273C37.7783 12.1429 36.8637 11.2345 35.734 11.2345C34.6044 11.2345 33.6924 12.1429 33.6924 13.273C33.6924 14.4053 34.6044 15.321 35.734 15.321Z"
        fill={color}
      />
      <path
        d="M35.734 26.5486C36.8637 26.5486 37.7783 25.6345 37.7783 24.5069C37.7783 23.3777 36.8637 22.4601 35.734 22.4601C34.6044 22.4601 33.6924 23.3777 33.6924 24.5069C33.6924 25.6345 34.6044 26.5486 35.734 26.5486Z"
        fill={color}
      />
      <path
        d="M35.734 4.08716C36.8637 4.08716 37.7783 3.17103 37.7783 2.04129C37.7783 0.916226 36.8637 9.33741e-05 35.734 9.33741e-05C34.6044 9.33741e-05 33.6924 0.916226 33.6924 2.04129C33.6924 3.17103 34.6044 4.08716 35.734 4.08716Z"
        fill={color}
      />
    </svg>
  );
}

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
    selectedCatalog,
    availableCatalogs,
    switchCatalog,
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
              className={`h-full flex items-center text-gray w-fit rounded-md px-1 ml-auto`}
              onClick={toggleNavbar}
            >
              <RiArrowLeftDoubleFill size={18} />
            </button>
          </>
        ) : (
          <button
            className="flex items-center w-7 h-7 justify-center bg-zinc-100 dark:bg-zinc-700 text-black dark:text-white rounded-md mx-auto"
            onClick={toggleNavbar}
          >
            <RiArrowLeftDoubleFill size={18} className="rotate-180" />
          </button>
        )}
      </div>
      {auth ? (
        <div className="mb-3">
        <Select
          className="ml-auto dark:text-white w-full"
          sx={CatalogSelectStyle}
          label={"Catalog"}
          labelId="catalog-label"
          value={selectedCatalog?.value || ""}
          id="catalog-select"
          variant="standard"
          onChange={(e) => {
            switchCatalog(e.target.value);
          }}
        >
          {availableCatalogs.map((catalog) => {
            const iconConfig =
              CATALOG_ICON_MAP[catalog.value] || DEFAULT_CATALOG_ICON;

            return (
              <MenuItem key={catalog.catalogId} value={catalog.value}>
                <div className="flex gap-3 items-center overflow-hidden">
                  {iconConfig.type === "stuDots" && iconConfig.color && (
                    <StuDots color={iconConfig.color} />
                  )}
                  {iconConfig.type === "customSvg" && iconConfig.svgUrl && (
                    <img
                      src={iconConfig.svgUrl}
                      alt=""
                      width="19"
                      height="13"
                    />
                  )}
                  <span className="truncate">{catalog.label}</span>
                </div>
              </MenuItem>
            );
          })}
        </Select>
        </div>
      ) : null}

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
            { import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === "true" && (
              <>
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
                  icon={<ChatIcon size={20} />}
                  isActive={
                    location.pathname === NAVIGATION_PATHS.aiAssistant ||
                    location.pathname === NAVIGATION_PATHS.aiChatHistory
                  }
                  textVisible={!isCollapsed}
                />
              </>
            )}
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
                className="bg-zinc-100 dark:bg-zinc-700 text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-600 p-2 rounded-md"
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
