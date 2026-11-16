import {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import ActivityMonitor from '../../components/admin/dashboard/ActivityMonitor';
import SemanticsDisclosure from '../../components/admin/dashboard/SemanticsDisclosure';
import {
  BorrowHeatmap,
  OutcomeBars,
  TopCategories,
} from '../../components/admin/dashboard/Patterns';
import ActionBoard from '../../components/admin/dashboard/ActionBoard';
import SubjectBalance from '../../components/admin/dashboard/SubjectBalance';
import Neighbourhoods from '../../components/admin/dashboard/Neighbourhoods';
import ExportMenu from '../../components/admin/dashboard/ExportMenu';
import TitleInspector from '../../components/admin/dashboard/TitleInspector';
import {
  SEMANTICS_ON,
  useDashboardMap,
  useSemanticIndex,
  useSubjectNames,
} from '../../components/admin/dashboard/semantic';
import {
  useHotkeys,
  usePrintReport,
} from '../../components/admin/dashboard/useDashboardKeys';

const RANGE_KEY = 'elvira.admin.dashboardRange';
const SEMANTICS_KEY = 'elvira.admin.dashboardSemantics';
/** Stable empty list, so the semantic index isn't rebuilt on every render while stats load. */
const EMPTY_TITLES: never[] = [];

const isRange = (v: string | null): v is StatsRange =>
  !!v && (STATS_RANGES as string[]).includes(v);

const storedRange = (): StatsRange => {
  try {
    const v = localStorage.getItem(RANGE_KEY);
    return isRange(v) ? v : '30d';
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
  <section id={id} className='scroll-mt-20 space-y-3 print:break-inside-auto'>
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
  const [searchParams, setSearchParams] = useSearchParams();
  // The URL wins (a shared link shows the same view); otherwise the last range this browser used.
  const urlRange = searchParams.get('range');
  const range: StatsRange = isRange(urlRange) ? urlRange : storedRange();
  const inspect = searchParams.get('inspect');
  const [highlight, setHighlight] = useState<string | null>(null);
  const [exportSignal, setExportSignal] = useState(0);
  const statistics = useAdminStatistics(range);
  const graph = useDashboardMap();

  useEffect(() => {
    let alive = true;
    getStats()
      .then((s) => alive && setStats(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [getStats]);

  const setParam = useCallback(
    (key: string, value: string | null) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value == null) next.delete(key);
          else next.set(key, value);
          return next;
        },
        // Opening/walking the inspector is history (Back steps back); closing and range changes are not.
        { replace: key === 'range' || value == null }
      ),
    [setSearchParams]
  );

  const go = (
    e: React.MouseEvent<HTMLButtonElement>,
    path: NAVIGATION_PATHS | string
  ) => {
    umamiTrack('Admin Dashboard Tile', { path });
    specialNavigation(e, path);
  };

  const openEntry = (entryId: string) => {
    umamiTrack('Admin Dashboard Inspect');
    setParam('inspect', entryId);
  };

  const track = (what: string) =>
    umamiTrack('Admin Dashboard Action', { what });

  const pickRange = useCallback(
    (r: StatsRange) => {
      setParam('range', r);
      umamiTrack('Admin Dashboard Range', { range: r });
      try {
        localStorage.setItem(RANGE_KEY, r);
      } catch {
        /* private mode — the choice simply isn't remembered */
      }
    },
    [setParam, umamiTrack]
  );

  const result = statistics.data;
  const data = result && result.status !== 'unavailable' ? result.data : null;
  const period = data?.period;
  const semantic = useSemanticIndex(
    graph.data,
    data?.titles ?? EMPTY_TITLES,
    period?.from
  );
  // Only worth a section when the graph actually knows some of the lent titles.
  const showMap =
    SEMANTICS_ON && !!graph.data?.nodes.length && !!semantic?.covered;
  const subjectNames = useSubjectNames(showMap);
  const meta = {
    catalog: import.meta.env.ELVIRA_CATALOG_ID as string,
    demo: result?.status === 'demo',
  };

  const { printing, print: printReport } = usePrintReport();
  // Collapsed by default: it is a specialist view; the choice is remembered per browser.
  const [semanticsOpen, setSemanticsOpenState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SEMANTICS_KEY) === 'open';
    } catch {
      return false;
    }
  });
  const setSemanticsOpen = useCallback((open: boolean) => {
    setSemanticsOpenState(open);
    try {
      localStorage.setItem(SEMANTICS_KEY, open ? 'open' : 'closed');
    } catch {
      /* private mode — not remembered */
    }
  }, []);

  useHotkeys({
    ...Object.fromEntries(
      STATS_RANGES.map((r, i) => [String(i + 1), () => pickRange(r)])
    ),
    e: data ? () => setExportSignal((n) => n + 1) : null,
    p: data
      ? () => {
          track('print-key');
          printReport();
        }
      : null,
    m: showMap
      ? () => {
          setSemanticsOpen(true);
          // After the section has expanded.
          requestAnimationFrame(() =>
            document
              .getElementById('semantics')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          );
        }
      : null,
  });

  return (
    <div className='pb-10'>
      <div className='print:hidden'>
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
      </div>

      <div
        id='admin-dashboard-report'
        className={`space-y-8 px-5 ${printing ? 'w-[960px] max-w-none' : ''}`}
      >
        {/* Only on paper: what this report is. */}
        {data && (
          <div className='hidden print:block'>
            <h1 className='text-2xl font-bold'>
              {t('administration.dashboard.export.printTitle')}
            </h1>
            <p className='text-sm text-zinc-600'>
              {t('administration.dashboard.range.period', {
                from: format(parseISO(data.period.from), 'd. M. yyyy'),
                to: format(parseISO(data.period.to), 'd. M. yyyy'),
                prevFrom: format(parseISO(data.period.previous_from), 'd. M.'),
                prevTo: format(
                  parseISO(data.period.previous_to),
                  'd. M. yyyy'
                ),
              })}
              {' · '}
              {t('administration.dashboard.export.generated', {
                at: format(parseISO(data.generated_at), 'd. M. yyyy HH:mm'),
              })}
              {meta.demo && ` · ${t('administration.dashboard.demo')}`}
            </p>
          </div>
        )}

        {/* One filter row scopes everything below it. */}
        <div className='flex flex-wrap items-center gap-3 print:hidden'>
          <div
            role='radiogroup'
            aria-label={t('administration.dashboard.range.label')}
            data-guide='admin-dashboard-range'
            className='inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-800'
          >
            {STATS_RANGES.map((r, i) => (
              <button
                key={r}
                type='button'
                role='radio'
                aria-checked={range === r}
                aria-keyshortcuts={String(i + 1)}
                title={t('administration.dashboard.shortcuts.rangeKey', {
                  key: i + 1,
                })}
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
          {data && (
            <div className='ml-auto flex items-center gap-3'>
              <span className='hidden text-[11px] text-zinc-400 xl:inline'>
                {t(
                  showMap
                    ? 'administration.dashboard.shortcuts.hint'
                    : 'administration.dashboard.shortcuts.hintNoMap'
                )}
              </span>
              <ExportMenu
                data={data}
                meta={meta}
                onTrack={(what) => track(`export-${what}`)}
                onPrint={printReport}
                openSignal={exportSignal}
              />
            </div>
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
                  <DemandQuadrant
                    titles={data.titles}
                    onOpen={openEntry}
                    highlight={highlight}
                    onHover={setHighlight}
                  />
                </div>
                <div className='min-w-0 xl:col-span-2'>
                  <UtilizationLeaderboard
                    titles={data.titles}
                    onOpen={openEntry}
                    highlight={highlight}
                    onHover={setHighlight}
                  />
                </div>
              </div>
              <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <DormantTitles
                  titles={data.titles}
                  onOpen={openEntry}
                  periodFrom={data.period.from}
                  onHover={setHighlight}
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
              <ActivityMonitor data={data} onTrack={track} />
              <div className='grid grid-cols-1 gap-4 xl:grid-cols-5'>
                <div className='min-w-0 xl:col-span-3'>
                  <BorrowHeatmap cells={data.heatmap} />
                </div>
                <div className='min-w-0 xl:col-span-2'>
                  <TopCategories
                    categories={data.categories}
                    onOpen={(id) => {
                      track('category');
                      navigate(
                        `${NAVIGATION_PATHS.adminEntries}?category-id=${id}`
                      );
                    }}
                  />
                </div>
              </div>
            </Section>

            {showMap && (
              <SemanticsDisclosure
                id='semantics'
                open={semanticsOpen}
                onToggle={(open) => {
                  setSemanticsOpen(open);
                  track(open ? 'semantics-open' : 'semantics-close');
                }}
                actions={semantic!.actions}
                guide='admin-dashboard-map'
              >
                  <ActionBoard
                    semantic={semantic!}
                    highlight={highlight}
                    onHover={setHighlight}
                    onOpen={openEntry}
                    onTrack={track}
                  />
                  <SubjectBalance
                    subjects={semantic!.subjects}
                    names={subjectNames}
                    onOpenSubject={(term) => {
                      const id = subjectNames.idOf(term);
                      if (!id) return;
                      track('subject');
                      navigate(
                        `${NAVIGATION_PATHS.adminEntries}?category-id=${id}`
                      );
                    }}
                  />
                  <Neighbourhoods
                    semantic={semantic!}
                    names={subjectNames}
                    titles={data.titles}
                    periodFrom={data.period.from}
                    highlight={highlight}
                    onHover={setHighlight}
                    onOpen={openEntry}
                    onTrack={track}
                  />
              </SemanticsDisclosure>
            )}
          </div>
        )}

        <div className='print:hidden'>
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

      {data && (
        <TitleInspector
          entryId={inspect}
          titles={data.titles}
          semantic={semantic}
          periodFrom={data.period.from}
          onClose={() => setParam('inspect', null)}
          onSelect={(id) => setParam('inspect', id)}
          onTrack={(what) => track(`inspector-${what}`)}
        />
      )}
    </div>
  );
};

export default AdminHome;
