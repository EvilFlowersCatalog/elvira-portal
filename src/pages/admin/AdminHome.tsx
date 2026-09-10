import { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBook, FaRobot } from 'react-icons/fa';
import { FiPlus, FiTag, FiUsers, FiEdit3, FiKey } from 'react-icons/fi';
import { MdOutlineCollectionsBookmark, MdOutlineLibraryBooks, MdOutlineInventory2 } from 'react-icons/md';
import useAppContext from '../../hooks/contexts/useAppContext';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { PageHeader } from '../../components/admin';
import Button from '../../components/buttons/Button';
import useAdminStats, { AdminStats } from '../../hooks/api/useAdminStats';

interface Tile {
  key: string;
  labelKey: string;
  statKey: keyof AdminStats;
  icon: ReactElement;
  path: NAVIGATION_PATHS;
  soon?: boolean;
  experimental?: boolean;
}

const TILES: Tile[] = [
  { key: 'publications', labelKey: 'administration.nav.publications', statKey: 'publications', icon: <FaBook size={22} />, path: NAVIGATION_PATHS.adminEntries },
  { key: 'collections', labelKey: 'administration.nav.collections', statKey: 'collections', icon: <MdOutlineCollectionsBookmark size={22} />, path: NAVIGATION_PATHS.adminFeeds },
  { key: 'categories', labelKey: 'administration.nav.categories', statKey: 'categories', icon: <FiTag size={22} />, path: NAVIGATION_PATHS.adminCategories },
  { key: 'authors', labelKey: 'administration.nav.authors', statKey: 'authors', icon: <FiEdit3 size={22} />, path: NAVIGATION_PATHS.adminAuthors },
  { key: 'catalogs', labelKey: 'administration.nav.catalogs', statKey: 'catalogs', icon: <MdOutlineLibraryBooks size={22} />, path: NAVIGATION_PATHS.adminCatalogs },
  { key: 'users', labelKey: 'administration.nav.users', statKey: 'users', icon: <FiUsers size={22} />, path: NAVIGATION_PATHS.adminUsers },
  { key: 'aiUsers', labelKey: 'administration.nav.aiUsers', statKey: 'users', icon: <FaRobot size={22} />, path: NAVIGATION_PATHS.adminAIUsers },
  { key: 'access', labelKey: 'administration.nav.access', statKey: 'users', icon: <FiKey size={22} />, path: NAVIGATION_PATHS.adminAccess },
];

TILES.push({ key: 'loans', labelKey: 'administration.nav.loans', statKey: 'users', icon: <MdOutlineInventory2 size={22} />, path: NAVIGATION_PATHS.adminLoans });

// AI Users / Access / Loans tiles show no numeric stat.
const STAT_TILES = new Set(['publications', 'collections', 'categories', 'authors', 'catalogs', 'users']);

const AdminHome = () => {
  const { specialNavigation, umamiTrack } = useAppContext();
  const { t } = useTranslation();
  const getStats = useAdminStats();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    let alive = true;
    getStats().then((s) => alive && setStats(s)).catch(() => {});
    return () => { alive = false; };
  }, [getStats]);

  const go = (e: React.MouseEvent<HTMLButtonElement>, path: NAVIGATION_PATHS) => {
    umamiTrack('Admin Dashboard Tile', { path });
    specialNavigation(e, path);
  };

  return (
    <div className="pb-10">
      <PageHeader
        title={t('administration.dashboard.title')}
        description={t('administration.dashboard.description')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={(e) => go(e, NAVIGATION_PATHS.adminAddEntries)} className="flex items-center gap-2">
              <FiPlus size={16} />
              {t('administration.dashboard.addPublication')}
            </Button>
            <button
              onClick={(e) => go(e, NAVIGATION_PATHS.adminUsers)}
              className="flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <FiUsers size={16} />
              {t('administration.dashboard.addUser')}
            </button>
          </div>
        }
      />

      <div className="px-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TILES.map((tile) => {
            const showStat = STAT_TILES.has(tile.key);
            const value = showStat ? stats?.[tile.statKey] : null;
            const disabled = tile.soon;
            return (
              <button
                key={tile.key}
                disabled={disabled}
                onClick={disabled ? undefined : (e) => go(e, tile.path)}
                className={`group relative flex flex-col justify-between gap-6 rounded-xl border p-5 text-left transition-all ${
                  disabled
                    ? 'cursor-default border-zinc-200 dark:border-zinc-700/60 bg-white/50 dark:bg-zinc-800/40'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm hover:border-primary hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${
                      disabled
                        ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-700/50 dark:text-zinc-500'
                        : 'bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight'
                    }`}
                  >
                    {tile.icon}
                  </span>
                  {tile.soon && (
                    <span className="rounded bg-zinc-100 dark:bg-zinc-700/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      {t('administration.nav.soon')}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t(tile.labelKey)}</span>
                  </div>
                  {showStat && (
                    <div className="mt-1 text-2xl font-extrabold tabular-nums text-secondary dark:text-secondaryLight">
                      {value == null ? (
                        <span className="inline-block h-7 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                      ) : (
                        value.toLocaleString()
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">{t('administration.dashboard.scopedNote')}</p>
      </div>
    </div>
  );
};

export default AdminHome;
