import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiSliders } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import DualRangeSlider from '../../../primitives/DualRangeSlider';
import { AcceptedLanguage, getLanguage } from '../../../../hooks/api/languages/languages';
import { AvailabilityState } from '../../../items/entry/details/AvailabilityBadge';
import { useLocalize } from '../../../../utils/func/localized';
import { ExploreFilters, PersonalFacet } from './useExploreFilters';

/** FEATURE: filters. The button that sits next to the map search. */
export function ExploreFilterButton({ filters }: { filters: ExploreFilters }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      aria-pressed={filters.open}
      aria-label={t('explore.filters.title')}
      title={t('explore.filters.title')}
      onClick={() => filters.setOpen(!filters.open)}
      className={twMerge(
        'relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-zinc-600 transition-colors dark:text-zinc-300',
        filters.open || filters.activeCount > 0
          ? 'border-primary bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight'
          : 'border-zinc-200 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800'
      )}
    >
      <FiSliders />
      {filters.activeCount > 0 && (
        <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-zinc-700 px-1 text-center text-[9px] font-bold leading-4 text-white dark:bg-zinc-200 dark:text-zinc-900">
          {filters.activeCount}
        </span>
      )}
    </button>
  );
}

const COLLAPSED = 6;

/** One facet: a heading and its options as rows (tick, label, count), like the topic tree beside it. */
function Facet({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { value: string; label: string; count: number }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [all, setAll] = useState(false);
  // Like the advanced search: an option with nothing behind it is hidden unless it is ticked.
  const rows = options.filter((o) => o.count > 0 || selected.includes(o.value));
  if (!rows.length) return null;
  const visible = all ? rows : rows.slice(0, COLLAPSED);
  return (
    <Group title={title}>
      <ul className="flex flex-col">
        {visible.map((o) => {
          const on = selected.includes(o.value);
          return (
            <li key={o.value}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => onToggle(o.value)}
                className={twMerge(
                  'flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left text-[13px] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800',
                  on ? 'font-semibold text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300'
                )}
              >
                <span
                  className={twMerge(
                    'grid h-4 w-4 shrink-0 place-items-center rounded border text-[11px]',
                    on ? 'border-primary bg-primary text-white' : 'border-zinc-300 dark:border-zinc-600'
                  )}
                >
                  {on && <FiCheck />}
                </span>
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                <span className="text-[11px] font-normal tabular-nums text-zinc-400">{o.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {rows.length > COLLAPSED && (
        <button type="button" onClick={() => setAll((v) => !v)} className="self-start px-2 text-xs font-semibold text-primary hover:underline dark:text-primaryLight">
          {all ? t('explore.filters.less') : t('explore.focus.showMore', { count: rows.length - COLLAPSED })}
        </button>
      )}
    </Group>
  );
}

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-1 border-t border-zinc-100 py-2 first:border-t-0 first:pt-0 dark:border-zinc-800">
    <h3 className="px-2 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{title}</h3>
    {children}
  </section>
);

const yearInput =
  'h-9 w-full min-w-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm tabular-nums text-zinc-900 outline-none transition-colors focus:border-primary focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:bg-zinc-900';

const AVAILABILITY: AvailabilityState[] = ['available', 'unavailable', 'borrowed', 'reserved'];
const PERSONAL: PersonalFacet[] = ['read', 'unread', 'shelf'];

/**
 * FEATURE: filters. Takes over the panel's list while open: the advanced search's facets in the
 * map's own look. What does not match is dimmed on the map.
 */
export default function ExploreFiltersView({ filters, total }: { filters: ExploreFilters; total: number }) {
  const { t, i18n } = useTranslation();
  const localize = useLocalize();
  const { state, facets } = filters;
  const count = (map: Map<string, number> | undefined, key: string) => map?.get(key) ?? 0;
  const years = facets?.years;
  const year = (value: string) => (/^\d{1,4}$/.test(value.trim()) ? Number(value) : null);

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center gap-2 px-4 py-2">
        <p className="min-w-0 flex-1 text-xs text-zinc-500 dark:text-zinc-400">
          {filters.loading || !facets
            ? t('explore.filters.loading')
            : filters.matches
              ? t(filters.mode === 'hide' ? 'explore.filters.matchesHidden' : 'explore.filters.matches', { count: filters.matches.size, total })
              : t('explore.filters.hint')}
        </p>
        {filters.activeCount > 0 && (
          <button type="button" onClick={filters.reset} className="shrink-0 text-xs font-semibold text-primary hover:underline dark:text-primaryLight">
            {t('explore.filters.reset')}
          </button>
        )}
        <button
          type="button"
          onClick={() => filters.setOpen(false)}
          className="shrink-0 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          {t('explore.filters.done')}
        </button>
      </div>

      {/* What happens to the publications that do not match. */}
      <div role="radiogroup" aria-label={t('explore.filters.mode')} className="mx-4 mb-2 flex h-8 items-center rounded-lg bg-zinc-100 p-0.5 text-xs dark:bg-zinc-800">
        {(['hide', 'dim'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={filters.mode === m}
            onClick={() => filters.setMode(m)}
            className={twMerge(
              'h-7 flex-1 rounded-md px-2 transition-colors',
              filters.mode === m ? 'bg-white font-semibold text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-white' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            )}
          >
            {t(`explore.filters.modes.${m}`)}
          </button>
        ))}
      </div>

      {facets && (
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <Facet
            title={t('explore.filters.personal')}
            options={PERSONAL.map((p) => ({ value: p, label: t(`explore.filters.mine.${p}`), count: count(facets.counts.personal, p) }))}
            selected={state.personal}
            onToggle={(v) => filters.toggle('personal', v as PersonalFacet)}
          />
          <Facet
            title={t('searchBar.availability')}
            options={AVAILABILITY.map((a) => ({ value: a, label: t(`entry.detail.availability.${a}`), count: count(facets.counts.availability, a) }))}
            selected={state.availability}
            onToggle={(v) => filters.toggle('availability', v as AvailabilityState)}
          />
          {years && (
            <Group title={t('searchBar.yearFromTo')}>
              <div className="px-3.5 pb-1 pt-2">
                <DualRangeSlider
                  min={years.min}
                  // A single-year range would give the slider zero width to work with.
                  max={Math.max(years.max, years.min + 1)}
                  value={[state.yearFrom ?? years.min, state.yearTo ?? years.max]}
                  onChange={([from, to]) => filters.setYears(from, to)}
                />
              </div>
              <div className="flex items-center gap-2 px-2">
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={t('searchBar.yearFrom')}
                  placeholder={String(years.min)}
                  value={state.yearFrom ?? ''}
                  onChange={(e) => filters.setYears(year(e.target.value), state.yearTo)}
                  className={yearInput}
                />
                <span className="text-zinc-400">–</span>
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={t('searchBar.yearTo')}
                  placeholder={String(years.max)}
                  value={state.yearTo ?? ''}
                  onChange={(e) => filters.setYears(state.yearFrom, year(e.target.value))}
                  className={yearInput}
                />
              </div>
            </Group>
          )}
          <Facet
            title={t('searchBar.language')}
            options={[...facets.counts.language]
              .map(([code, n]) => ({ value: code, label: getLanguage(code)?.name[i18n.language as AcceptedLanguage] ?? code.toUpperCase(), count: n }))
              .sort((a, b) => b.count - a.count)}
            selected={state.languages}
            onToggle={(v) => filters.toggle('languages', v)}
          />
          <Facet
            title={t('searchBar.categories')}
            options={[...facets.categories.values()]
              .map((c) => ({ value: c.id, label: localize(c.label) || c.term, count: count(facets.counts.category, c.id) }))
              .sort((a, b) => b.count - a.count)}
            selected={state.categories}
            onToggle={(v) => filters.toggle('categories', v)}
          />
        </div>
      )}
    </div>
  );
}
