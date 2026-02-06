import useAppContext from "../../../hooks/contexts/useAppContext";
import {
  LANG_TYPE,
  NAVIGATION_PATHS,
  THEME_TYPE,
} from "../../../utils/interfaces/general/general";

import { ReactElement } from "react";
import {
  IoDocumentsOutline,
  IoMoonOutline,
  IoSunnyOutline,
} from "react-icons/io5";
import { MdOutlineFeed } from "react-icons/md";
import {
  RiAdminLine,
  RiAiGenerate,
  RiArrowLeftDoubleFill,
} from "react-icons/ri";
import { PiBooks } from "react-icons/pi";
import { HiOutlineLanguage } from "react-icons/hi2";
import useAuthContext from "../../../hooks/contexts/useAuthContext";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { FiBookOpen, FiLogOut } from "react-icons/fi";
import Gravatar from "react-gravatar";
import Button from "../../buttons/Button";
import { FaHome } from "react-icons/fa";
import { MenuItem, Select } from "@mui/material";
import { MUISelectStyle } from "../../inputs/ElviraSelect";
import { CATALOG_ICON_MAP, DEFAULT_CATALOG_ICON } from "../../../utils/catalogIcons";

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
}
const NavbarButton = ({
  name,
  path = "",
  icon,
  isActive,
  onClick = null,
}: INavbarButtonParams) => {
  const { specialNavigation, umamiTrack } = useAppContext();

  return (
    <button
      className={`flex w-full gap-2 items-center px-5 py-1 rounded-md ${
        isActive
          ? "bg-primaryLight dark:bg-primary text-primary dark:text-primaryLight"
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

  return (
    <div className="flex flex-col gap-6 w-64 h-full bg-zinc-100 dark:bg-zinc-800 pt-8 pb-3 px-5 overflow-auto">
      {/* Logos */}
      <div className="flex justify-between items-center">
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
            className={`h-auto ${isSmallDevice ? "w-36" : "w-full"}`}
            src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
            alt="Elvira Logo"
          />
        </button>
        {isSmallDevice && (
          <button
            className={`bg-primary h-full flex items-center text-white w-fit rounded-md px-1`}
            onClick={() => setShowNavbar(false)}
          >
            <RiArrowLeftDoubleFill size={18} />
          </button>
        )}
      </div>

     { auth ? ( <Select
        className="ml-auto dark:text-white w-full"
        sx={MUISelectStyle}
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
          const iconConfig = CATALOG_ICON_MAP[catalog.value] || DEFAULT_CATALOG_ICON;
          
          return (
            <MenuItem key={catalog.catalogId} value={catalog.value}>
              <div className="flex gap-3 items-center overflow-hidden">
                {iconConfig.type === 'stuDots' && iconConfig.color && (
                  <StuDots color={iconConfig.color} />
                )}
                {iconConfig.type === 'customSvg' && iconConfig.svgUrl && (
                  <img src={iconConfig.svgUrl} alt="" width="19" height="13" />
                )}
                <span className="truncate">
                {catalog.label}
                </span>
              </div>
            </MenuItem>
          );
        })}
      </Select>) : null}

      {/* Portal container */}
      {auth && (
        <div className="flex gap-2 flex-col items-start">
          <span className="uppercase font-medium">
            {t("navbarMenu.portal")}
          </span>
          <NavbarButton
            name={t("navbarMenu.home")}
            path={NAVIGATION_PATHS.home}
            icon={<FaHome size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.home}
          />
          <NavbarButton
            name={t("navbarMenu.library")}
            path={NAVIGATION_PATHS.library}
            icon={<FiBookOpen size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.library}
          />
          <NavbarButton
            name={t("navbarMenu.feeds")}
            path={NAVIGATION_PATHS.feeds}
            icon={<MdOutlineFeed size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.feeds}
          />
          <NavbarButton
            name={t("navbarMenu.aiAssistant")}
            path={NAVIGATION_PATHS.aiChatHistory}
            icon={<RiAiGenerate size={23} />}
            isActive={
              location.pathname === NAVIGATION_PATHS.aiAssistant ||
              location.pathname === NAVIGATION_PATHS.aiChatHistory
            }
          />
          {/* <NavbarButton
            name={t('navbarMenu.about')}
            path={NAVIGATION_PATHS.about}
            icon={<FiHelpCircle size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.about}
          /> */}
          {auth.isSuperUser && (
            <NavbarButton
              name={t("navbarMenu.administration")}
              path={NAVIGATION_PATHS.adminHome}
              icon={<RiAdminLine size={23} />}
              isActive={location.pathname.includes("administration")}
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
        <div className="flex gap-2 flex-col items-start">
          <span className="font-bold mb-3 uppercase font-medium">
            {t("navbarMenu.personal")}
          </span>
          <NavbarButton
            name={t("navbarMenu.myShelf")}
            path={NAVIGATION_PATHS.shelf}
            icon={<PiBooks size={23} />}
            isActive={location.pathname === NAVIGATION_PATHS.shelf}
          />
          {import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === "true" && (
            <NavbarButton
              name={t("navbarMenu.loan")}
              path={NAVIGATION_PATHS.loans}
              icon={<IoDocumentsOutline size={23} />}
              isActive={location.pathname === NAVIGATION_PATHS.loans}
            />
          )}
        </div>
      )}

      {/* Settings container */}
      <div className="flex flex-col items-start">
        <span className="font-bold mb-3 uppercase font-medium">
          {t("navbarMenu.settings")}
        </span>
        <NavbarButton
          name={isDark() ? t("navbarMenu.lightMode") : t("navbarMenu.darkMode")}
          path=""
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
          name={lang === LANG_TYPE.sk ? "EN" : "SK"}
          onClick={switchLang}
          path=""
          icon={<HiOutlineLanguage size={23} />}
          isActive={false}
        />
      </div>

      {/* Logout */}
      {auth && (
        <>
          <div className="flex flex px-4 py-2 mt-auto items-center gap-2 rounded-lg bg-slate-200 dark:bg-darkGray">
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
        </>
      )}
    </div>
  );
};

export default Navbar;
