import { ReactElement, ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { FaBook } from 'react-icons/fa';
import {
  FiPlus,
  FiTag,
  FiUsers,
  FiEdit3,
  FiMessageSquare,
  FiInfo,
} from 'react-icons/fi';
import {
  MdOutlineCollectionsBookmark,
  MdOutlineLibraryBooks,
} from 'react-icons/md';
import useAppContext from '../../hooks/contexts/useAppContext';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { PageHeader } from '../../components/admin';
import Button from '../../components/buttons/Button';
import useAdminStats, { AdminStats } from '../../hooks/api/useAdminStats';
import useAdminStatistics, {
  STATS_RANGES,
  StatsRange,
} from '../../hooks/api/statistics/useAdminStatistics';
import AttentionStrip from '../../components/admin/dashboard/AttentionStrip';
import KpiTiles from '../../components/admin/dashboard/KpiTiles';
import DemandQuadrant from '../../components/admin/dashboard/DemandQuadrant';
import {
  DormantTitles,
  UtilizationLeaderboard,
} from '../../components/admin/dashboard/TitleLists';
import LendingTrend from '../../components/admin/dashboard/LendingTrend';
import {
  BorrowHeatmap,
  OutcomeBars,
  TopCategories,
} from '../../components/admin/dashboard/Patterns';

const RANGE_KEY = 'elvira.admin.dashboardRange';

const readRange = (): StatsRange => {
  try {
    const v = localStorage.getItem(RANGE_KEY) as StatsRange | null;
    return v && STATS_RANGES.includes(v) ? v : '30d';
  } catch {
    return '30d';
  }
};

interface InventoryItem {
  key: keyof AdminStats;
  labelKey: string;
  icon: ReactElement;
  path: NAVIGATION_PATHS;
}

const INVENTORY: InventoryItem[] = [
  {
    key: 'publications',
    labelKey: 'administration.nav.publications',
    icon: <FaBook size={16} />,
    path: NAVIGATION_PATHS.adminEntries,
  },
  {
    key: 'collections',
    labelKey: 'administration.nav.collections',
    icon: <MdOutlineCollectionsBookmark size={16} />,
    path: NAVIGATION_PATHS.adminFeeds,
  },
  {
    key: 'categories',
    labelKey: 'administration.nav.categories',
    icon: <FiTag size={16} />,
    path: NAVIGATION_PATHS.adminCategories,
  },
  {
    key: 'authors',
    labelKey: 'administration.nav.authors',
    icon: <FiEdit3 size={16} />,
    path: NAVIGATION_PATHS.adminAuthors,
  },
  {
    key: 'catalogs',
    labelKey: 'administration.nav.catalogs',
    icon: <MdOutlineLibraryBooks size={16} />,
    path: NAVIGATION_PATHS.adminCatalogs,
  },
  {
    key: 'users',
    labelKey: 'administration.nav.users',
    icon: <FiUsers size={16} />,
    path: NAVIGATION_PATHS.adminUsers,
  },
];

const Section = ({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <section id={id} className='scroll-mt-20 space-y-3'>
    <div>
      <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight'>
        {title}
      </h2>
      {subtitle && (
        <p className='text-sm text-zinc-500 dark:text-zinc-400'>{subtitle}</p>
      )}
    </div>
    {children}
  </section>
);

const AdminHome = () => {
  const { specialNavigation, umamiTrack } = useAppContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const getStats = useAdminStats();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [range, setRange] = useState<StatsRange>(readRange);
  const statistics = useAdminStatistics(range);

  useEffect(() => {
    let alive = true;
    getStats()
      .then((s) => alive && setStats(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [getStats]);

  const go = (
    e: React.MouseEvent<HTMLButtonElement>,
    path: NAVIGATION_PATHS | string
  ) => {
    umamiTrack('Admin Dashboard Tile', { path });
    specialNavigation(e, path);
  };

  const openEntry = (entryId: string) => {
    umamiTrack('Admin Dashboard Open Entry');
    navigate(NAVIGATION_PATHS.adminEditEntries + entryId);
  };

  const pickRange = (r: StatsRange) => {
    setRange(r);
    umamiTrack('Admin Dashboard Range', { range: r });
    try {
      localStorage.setItem(RANGE_KEY, r);
    } catch {
      /* private mode — the choice simply isn't remembered */
    }
  };

  const result = statistics.data;
  const data = result && result.status !== 'unavailable' ? result.data : null;
  const period = data?.period;

  return (
    <div className='pb-10'>
      <PageHeader
        title={t('administration.dashboard.title')}
        description={t('administration.dashboard.description')}
        actions={
          <div className='flex flex-wrap gap-2'>
            <Button
              onClick={(e) => go(e, NAVIGATION_PATHS.adminAddEntries)}
              className='flex items-center gap-2'
            >
              <FiPlus size={16} />
              {t('administration.dashboard.addPublication')}
            </Button>
            <button
              onClick={(e) => go(e, NAVIGATION_PATHS.adminUsers)}
              className='flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700'
            >
              <FiUsers size={16} />
              {t('administration.dashboard.addUser')}
            </button>
            <a
              href='https://feedback.elvira.stuba.sk'
              target='_blank'
              rel='noopener noreferrer'
              onClick={() => umamiTrack('Admin Dashboard Feedback')}
              className='flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700'
            >
              <FiMessageSquare size={16} />
              {t('administration.dashboard.feedback')}
            </a>
          </div>
        }
      />

      <div className='space-y-8 px-5'>
        {/* One filter row scopes everything below it. */}
        <div className='flex flex-wrap items-center gap-3'>
          <div
            role='radiogroup'
            aria-label={t('administration.dashboard.range.label')}
            className='inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-800'
          >
            {STATS_RANGES.map((r) => (
              <button
                key={r}
                type='button'
                role='radio'
                aria-checked={range === r}
                onClick={() => pickRange(r)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  range === r
                    ? 'bg-secondary text-white dark:bg-secondaryLight dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {t(`administration.dashboard.range.${r}`)}
              </button>
            ))}
          </div>
          {period && (
            <span className='text-xs text-zinc-500 dark:text-zinc-400'>
              {t('administration.dashboard.range.period', {
                from: format(parseISO(period.from), 'd. M. yyyy'),
                to: format(parseISO(period.to), 'd. M. yyyy'),
                prevFrom: format(parseISO(period.previous_from), 'd. M.'),
                prevTo: format(parseISO(period.previous_to), 'd. M. yyyy'),
              })}
            </span>
          )}
          {result?.status === 'demo' && (
            <span
              className='rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/50 dark:text-amber-100'
              title={t('administration.dashboard.demoHelp')}
            >
              {t('administration.dashboard.demo')}
            </span>
          )}
        </div>

        {statistics.isError && (
          <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'>
            {t('administration.dashboard.error')}
          </div>
        )}

        {result?.status === 'unavailable' && (
          <div className='flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
            <FiInfo
              size={20}
              className='mt-0.5 shrink-0 text-zinc-400'
              aria-hidden
            />
            <div>
              <p className='font-semibold text-zinc-800 dark:text-zinc-100'>
                {t('administration.dashboard.unavailable.title')}
              </p>
              <p className='mt-1'>
                {t('administration.dashboard.unavailable.body')}
              </p>
            </div>
          </div>
        )}

        {statistics.isPending && !data && (
          <div className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5'>
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className='h-40 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800'
              />
            ))}
          </div>
        )}

        {data && (
          // Refetch keeps the frame: previous data stays, dimmed, instead of a skeleton flash.
          <div
            className={`space-y-8 transition-opacity ${statistics.isPlaceholderData ? 'opacity-60' : ''}`}
          >
            <Section title={t('administration.dashboard.sections.attention')}>
              <AttentionStrip attention={data.attention} onNavigate={go} />
              <KpiTiles
                kpis={data.kpis}
                partial={data.series.map((b) => b.partial)}
              />
            </Section>

            <Section
              id='demand'
              title={t('administration.dashboard.sections.demand')}
              subtitle={t('administration.dashboard.sections.demandSub')}
            >
              <div className='grid grid-cols-1 gap-4 xl:grid-cols-5'>
                <div className='min-w-0 xl:col-span-3'>
                  <DemandQuadrant titles={data.titles} onOpen={openEntry} />
                </div>
                <div className='min-w-0 xl:col-span-2'>
                  <UtilizationLeaderboard
                    titles={data.titles}
                    onOpen={openEntry}
                  />
                </div>
              </div>
              <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <DormantTitles
                  titles={data.titles}
                  onOpen={openEntry}
                  periodFrom={data.period.from}
                />
                <OutcomeBars
                  holds={data.hold_outcomes}
                  loans={data.loan_outcomes}
                />
              </div>
              {data.titles_truncated && (
                <p className='text-xs text-zinc-500'>
                  {t('administration.dashboard.truncated')}
                </p>
              )}
            </Section>

            <Section
              title={t('administration.dashboard.sections.trends')}
              subtitle={t('administration.dashboard.sections.trendsSub')}
            >
              <LendingTrend series={data.series} bucket={data.period.bucket} />
              <div className='grid grid-cols-1 gap-4 xl:grid-cols-5'>
                <div className='min-w-0 xl:col-span-3'>
                  <BorrowHeatmap cells={data.heatmap} />
                </div>
                <div className='min-w-0 xl:col-span-2'>
                  <TopCategories categories={data.categories} />
                </div>
              </div>
            </Section>
          </div>
        )}

        <Section title={t('administration.dashboard.sections.inventory')}>
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6'>
            {INVENTORY.map((item) => (
              <button
                key={item.key}
                type='button'
                onClick={(e) => go(e, item.path)}
                className='flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-primary dark:border-zinc-700 dark:bg-zinc-800'
              >
                <span className='text-primaryText dark:text-primaryLight'>
                  {item.icon}
                </span>
                <span className='min-w-0'>
                  <span className='block truncate text-xs text-zinc-500 dark:text-zinc-400'>
                    {t(item.labelKey)}
                  </span>
                  <span className='block text-lg font-bold text-zinc-900 dark:text-zinc-50'>
                    {stats?.[item.key] == null ? (
                      <span className='inline-block h-5 w-10 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
                    ) : (
                      stats[item.key]!.toLocaleString()
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <p className='text-xs text-zinc-400 dark:text-zinc-500'>
            {t('administration.dashboard.scopedNote')}
          </p>
        </Section>
      </div>
    </div>
  );
};

export default AdminHome;
