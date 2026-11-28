import { useMemo, useState } from 'react';
import useExploreEntries from '../../../../hooks/api/graph/useExploreEntries';
import { AVAILABILITY_TO_LCP_STATE } from '../../../../hooks/api/entries/entryFilters';
import { AvailabilityState } from '../../../items/entry/details/AvailabilityBadge';
import { ExploreGraph, PersonalMark } from '../../../../utils/func/exploreGraph';
import { IEntry } from '../../../../utils/interfaces/entry';
import { ICategory } from '../../../../utils/interfaces/category';

/**
 * FEATURE: filters on the Explore map. The same facets as the catalogue's advanced search
 * (availability, year, language, categories), plus the reader's own (read, unread, on the shelf),
 * counted over the publications on the map: a facet's counts apply every other facet, so a
 * selected language still lists the others that could be added.
 * Self-contained: this folder plus the `FEATURES.filters` lines in pages/common/Explore.tsx.
 */
export type PersonalFacet = 'read' | 'unread' | 'shelf';

export interface ExploreFilterState {
  availability: AvailabilityState[];
  yearFrom: number | null;
  yearTo: number | null;
  languages: string[];
  categories: string[];
  personal: PersonalFacet[];
}

const EMPTY: ExploreFilterState = { availability: [], yearFrom: null, yearTo: null, languages: [], categories: [], personal: [] };
type Dimension = 'availability' | 'year' | 'language' | 'category' | 'personal';

const yearOf = (entry: IEntry) => (entry.published_at ? new Date(entry.published_at).getFullYear() : null);
const availabilityOf = (entry: IEntry) =>
  (Object.keys(AVAILABILITY_TO_LCP_STATE) as AvailabilityState[]).filter((state) => AVAILABILITY_TO_LCP_STATE[state].includes(entry.lcp_state ?? ''));
const personalOf = (mark: PersonalMark | undefined): PersonalFacet[] => [mark?.readAt ? 'read' : 'unread', ...(mark?.shelfAt ? (['shelf'] as const) : [])];

export default function useExploreFilters(graph: ExploreGraph | null, marks: Map<string, PersonalMark>) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ExploreFilterState>(EMPTY);
  // hide removes what does not match from the map; dim keeps it in place, faded.
  const [mode, setMode] = useState<'hide' | 'dim'>('hide');
  const active: Record<Dimension, boolean> = {
    availability: state.availability.length > 0,
    year: state.yearFrom !== null || state.yearTo !== null,
    language: state.languages.length > 0,
    category: state.categories.length > 0,
    personal: state.personal.length > 0,
  };
  const activeCount = Object.values(active).filter(Boolean).length;

  // The records are only asked for once the filters are opened.
  const { data: entries, isLoading } = useExploreEntries(graph, open || activeCount > 0);

  const computed = useMemo(() => {
    if (!graph || !entries) return null;
    const tests: Record<Dimension, (entry: IEntry) => boolean> = {
      availability: (e) => !state.availability.length || availabilityOf(e).some((a) => state.availability.includes(a)),
      year: (e) => {
        const year = yearOf(e);
        if (state.yearFrom !== null && (year === null || year < state.yearFrom)) return false;
        return !(state.yearTo !== null && (year === null || year > state.yearTo));
      },
      language: (e) => !state.languages.length || state.languages.includes(e.language?.alpha2 ?? ''),
      category: (e) => !state.categories.length || (e.categories ?? []).some((c) => state.categories.includes(c.id)),
      personal: (e) => !state.personal.length || personalOf(marks.get(e.id)).some((p) => state.personal.includes(p)),
    };
    const dims = Object.keys(tests) as Dimension[];
    const tally = () => new Map<string, number>();
    const counts = { availability: tally(), language: tally(), category: tally(), personal: tally() };
    const categories = new Map<string, ICategory>();
    const years = { min: Infinity, max: -Infinity };
    const matches = new Set<string>();
    const add = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);

    entries.forEach((entry) => {
      if (!graph.byId.has(entry.id)) return;
      const failed = dims.filter((d) => !tests[d](entry));
      if (!failed.length) matches.add(entry.id);
      // A facet counts what the other facets leave.
      const passesOthers = (d: Dimension) => failed.every((f) => f === d);
      if (passesOthers('availability')) availabilityOf(entry).forEach((a) => add(counts.availability, a));
      if (passesOthers('language') && entry.language?.alpha2) add(counts.language, entry.language.alpha2);
      if (passesOthers('personal')) personalOf(marks.get(entry.id)).forEach((p) => add(counts.personal, p));
      if (passesOthers('category')) {
        (entry.categories ?? []).forEach((c) => {
          add(counts.category, c.id);
          categories.set(c.id, c);
        });
      }
      const year = yearOf(entry);
      if (passesOthers('year') && year !== null) {
        years.min = Math.min(years.min, year);
        years.max = Math.max(years.max, year);
      }
    });
    return { counts, categories, years: Number.isFinite(years.min) ? years : null, matches };
  }, [graph, entries, state, marks]);

  const toggle = <K extends 'availability' | 'languages' | 'categories' | 'personal'>(key: K, value: ExploreFilterState[K][number]) =>
    setState((prev) => {
      const list = prev[key] as string[];
      return { ...prev, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });

  return {
    open,
    setOpen,
    state,
    toggle,
    setYears: (yearFrom: number | null, yearTo: number | null) => setState((prev) => ({ ...prev, yearFrom, yearTo })),
    reset: () => setState(EMPTY),
    activeCount,
    mode,
    setMode,
    facets: computed,
    /** Ids that pass every active filter; null when nothing is filtered. */
    matches: activeCount > 0 ? (computed?.matches ?? null) : null,
    loading: isLoading,
  };
}

export type ExploreFilters = ReturnType<typeof useExploreFilters>;
