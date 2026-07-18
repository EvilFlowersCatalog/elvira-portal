import { ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';
import {
  FiGrid,
  FiUsers,
  FiKey,
  FiTag,
  FiEdit3,
} from 'react-icons/fi';
import { FaBook, FaRobot } from 'react-icons/fa';
import { MdOutlineCollectionsBookmark, MdOutlineLibraryBooks, MdOutlineInventory2 } from 'react-icons/md';
import useAppContext from '../../hooks/contexts/useAppContext';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';

interface NavItem {
  key: string;
  path: NAVIGATION_PATHS;
  icon: ReactElement;
  /** exact match required (dashboard index). */
  exact?: boolean;
  /** hidden unless experimental features are on. */
  experimental?: boolean;
  /** not built yet — shown disabled for orientation. */
  soon?: boolean;
}

interface NavGroup {
  labelKey?: string;
  items: NavItem[];
}

const ICON = 18;

const GROUPS: NavGroup[] = [
  {
    items: [
      { key: 'dashboard', path: NAVIGATION_PATHS.adminHome, icon: <FiGrid size={ICON} />, exact: true },
    ],
  },
  {
    labelKey: 'administration.nav.groupContent',
    items: [
      { key: 'publications', path: NAVIGATION_PATHS.adminEntries, icon: <FaBook size={ICON} /> },
      { key: 'collections', path: NAVIGATION_PATHS.adminFeeds, icon: <MdOutlineCollectionsBookmark size={ICON} /> },
      { key: 'categories', path: NAVIGATION_PATHS.adminCategories, icon: <FiTag size={ICON} /> },
      { key: 'authors', path: NAVIGATION_PATHS.adminAuthors, icon: <FiEdit3 size={ICON} /> },
      { key: 'catalogs', path: NAVIGATION_PATHS.adminCatalogs, icon: <MdOutlineLibraryBooks size={ICON} /> },
    ],
  },
  {
    labelKey: 'administration.nav.groupPeople',
    items: [
      { key: 'users', path: NAVIGATION_PATHS.adminUsers, icon: <FiUsers size={ICON} /> },
      { key: 'aiUsers', path: NAVIGATION_PATHS.adminAIUsers, icon: <FaRobot size={ICON} /> },
      { key: 'access', path: NAVIGATION_PATHS.adminAccess, icon: <FiKey size={ICON} /> },
    ],
  },
  {
    labelKey: 'administration.nav.groupCirculation',
    items: [
      { key: 'loans', path: NAVIGATION_PATHS.adminLoans, icon: <MdOutlineInventory2 size={ICON} /> },
    ],
  },
];

const experimentalOn = import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true';

export default function AdminNav() {
  const { t } = useTranslation();
  const { specialNavigation, umamiTrack } = useAppContext();
  const location = useLocation();

  const isActive = (item: NavItem) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  return (
    <nav
      aria-label={t('administration.sectionLabel')}
      className="shrink-0 border-b border-zinc-200 dark:border-zinc-700 lg:w-60 lg:border-b-0 lg:border-r"
    >
      <div className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-3 lg:py-4">
        {GROUPS.map((group, gi) => {
          const items = group.items.filter((it) => !it.experimental || experimentalOn);
          if (items.length === 0) return null;
          return (
            <div key={gi} className="flex gap-1 lg:mb-2 lg:flex-col lg:gap-0.5">
              {group.labelKey && (
                <span className="hidden lg:block px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {t(group.labelKey)}
                </span>
              )}
              {items.map((item) => {
                const active = isActive(item);
                const label = t(`administration.nav.${item.key}`);
                if (item.soon) {
                  return (
                    <span
                      key={item.key}
                      aria-disabled="true"
                      title={`${label} — ${t('administration.nav.soon')}`}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 dark:text-zinc-600 whitespace-nowrap cursor-default"
                    >
                      <span className="shrink-0 opacity-70">{item.icon}</span>
                      <span className="hidden lg:inline">{label}</span>
                      <span className="hidden lg:inline ml-auto rounded bg-zinc-100 dark:bg-zinc-700/50 px-1.5 py-0.5 text-[10px] font-medium uppercase">
                        {t('administration.nav.soon')}
                      </span>
                    </span>
                  );
                }
                return (
                  <button
                    key={item.key}
                    onClick={(e) => {
                      umamiTrack('Admin Nav', { path: item.path });
                      specialNavigation(e, item.path);
                    }}
                    aria-current={active ? 'page' : undefined}
                    className={twMerge(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                      active
                        ? 'bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
                    )}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="hidden lg:inline">{label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
