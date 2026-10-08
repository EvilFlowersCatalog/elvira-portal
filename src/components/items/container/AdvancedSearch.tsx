import { useSearchParams } from "react-router-dom";
import useAppContext from "../../../hooks/contexts/useAppContext"
import { useTranslation } from "react-i18next";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { ICategory } from "../../../utils/interfaces/category";
import { IoClose } from "react-icons/io5";
import AdvancedCheckboxes from "../../inputs/AdvancedCheckboxes";
import Checkbox from "../../primitives/Checkbox";
import DualRangeSlider from "../../primitives/DualRangeSlider";
import useGetCategories from "../../../hooks/api/categories/useGetCategories";
import useFeedsQuery from "../../../hooks/api/feeds/useFeedsQuery";
import useEntryFacets from "../../../hooks/api/entries/useEntryFacets";
import { EntryFilters, useEntryFilters } from "../../../hooks/api/entries/entryFilters";
import { AcceptedLanguage, getLanguage, getLanguages } from "../../../hooks/api/languages/languages";
import { IFeed } from "../../../utils/interfaces/feed";
import { AvailabilityState } from "../entry/details/AvailabilityBadge";
import { readCategoryIds, readFeedIds, setCategoryIds, setFeedIds } from "../../../utils/func/filterParams";

const DEFAULT_MIN_YEAR = 1900;

type AvailabilityOption = { value: AvailabilityState; labelKey: string };

const AVAILABILITY_OPTIONS: AvailabilityOption[] = [
    { value: 'available',   labelKey: 'entry.detail.availability.available' },
    { value: 'unavailable', labelKey: 'entry.detail.availability.unavailable' },
    { value: 'borrowed',    labelKey: 'entry.detail.availability.borrowed' },
    { value: 'reserved',    labelKey: 'entry.detail.availability.reserved' },
];

function SectionDivider() {
    return <div className="h-px w-full bg-[rgba(0,0,0,0.1)] dark:bg-[rgba(255,255,255,0.1)]" />;
}

type EntryScope = Partial<EntryFilters> | null | undefined;

export function AdvancedSearchWrapper({ children, enabled = true, entryScope }: { children: React.ReactNode; enabled?: boolean; entryScope?: EntryScope }) {
    const { showAdvancedSearch, setShowAdvancedSearch } = useAppContext();

    if (!enabled) return <div className="w-full pt-3">{children}</div>;

    return (
        <div className="flex flex-col md:flex-row">
            {/* Desktop sidebar */}
            <div
                className={`
                    hidden md:block
                    border-r border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.08)]
                    transition-all duration-500 ease-in-out
                    overflow-auto ${showAdvancedSearch ? 'max-w-[260px] opacity-100 p-4' : 'max-w-0 opacity-0'} w-full
                    sticky top-0 z-2 pb-32 h-screen
                `}
            >
                <AdvancedSearch entryScope={entryScope} />
            </div>
            {/* Mobile fixed top/bottom sheet */}
            <div
                className={`
                    md:hidden
                    fixed left-0 right-0
                    transition-all duration-500 ease-in-out
                    bg-slate-200 dark:bg-darkGray
                    z-30
                    ${showAdvancedSearch ? 'top-0 bottom-0 opacity-100 p-4' : '-top-full opacity-0 pointer-events-none'}
                    rounded-none h-screen overflow-y-auto
                `}
            >
                <div className="pt-4 mb-2">
                    <IoClose size={24} className="absolute top-3 right-3 cursor-pointer" onClick={() => setShowAdvancedSearch(false)} />
                </div>
                <AdvancedSearch entryScope={entryScope} />
            </div>
            <div className="w-full pt-3">
                {children}
            </div>
        </div>
    );
}

/**
 * `entryScope` bounds the facet counts to the entries the page lists (e.g. the
 * shelf's ids). `undefined` = the whole catalog, `null` = scope still loading.
 */
export function AdvancedSearch({ entryScope }: { entryScope?: EntryScope }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const { t, i18n } = useTranslation();

    const [year, setYear] = useState<string[]>(["", ""]);
    const [languageCodes, setLanguageCodes] = useState<string[]>([]);
    const [availability, setAvailability] = useState<AvailabilityState[]>([]);
    const yearDebounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentYear = new Date().getFullYear();
    // Which year input is being edited — it shows the raw value while focused and
    // the pre-filled facet bound otherwise.
    const [focusedYear, setFocusedYear] = useState<0 | 1 | null>(null);

    const getCategories = useGetCategories();
    const filters = useEntryFilters();
    const scopeLoading = entryScope === null;
    // An empty `ids` scope (empty shelf) would count the whole catalog — nothing to facet.
    const emptyScope = entryScope?.ids === '';
    const facets = useEntryFacets({ ...filters, ...entryScope }, { enabled: !scopeLoading && !emptyScope });
    // Counts drive which options are shown: `{}` hides everything but the selection
    // (still loading / empty scope), `undefined` shows every option without counts
    // (facets request failed — don't lock the user out of filtering).
    const facetCounts = (counts: Record<string, number>) =>
        emptyScope ? {} : facets.ready ? counts : facets.failed ? undefined : {};
    const availabilityCounts = facetCounts(facets.availabilityCounts);
    const languageCounts = facetCounts(facets.languageCounts);
    const categoryCounts = facetCounts(facets.categoryCounts);
    const feedCounts = facetCounts(facets.feedCounts);
    // Mirrors AdvancedCheckboxes' own filtering: with counts, only options that
    // have books (or are currently selected) are listed.
    const hasOptions = (options: { value: string }[], counts: Record<string, number> | undefined, selected: string[]) =>
        !counts || options.some(o => (counts[o.value] ?? 0) > 0 || selected.includes(o.value));

    // Year bounds of the entries the other filters leave (the year filter itself is
    // ignored). They pre-fill the inputs/slider but are only sent once the user
    // interacts — entries without a year would drop out of a `published_at` filter.
    const minYear = facets.years.min ?? DEFAULT_MIN_YEAR;
    const maxYear = facets.years.max ?? currentYear;
    const prefilledYear = (index: 0 | 1) => {
        const bound = index === 0 ? facets.years.min : facets.years.max;
        return facets.ready && bound != null ? String(bound) : '';
    };
    const [allCategories, setAllCategories] = useState<ICategory[]>([]);
    const [categoriesLoaded, setCategoriesLoaded] = useState(false);
    const [activeCategories, setActiveCategories] = useState<ICategory[]>([]);

    const [activeFeeds, setActiveFeeds] = useState<IFeed[]>([]);

    // Collections list (cached/deduped by React Query).
    const { data: feedsData, isSuccess: feedsOk, isError: feedsFailed } = useFeedsQuery({ paginate: false });
    const allFeeds = useMemo<IFeed[]>(() => feedsData?.items ?? [], [feedsData]);
    const feedsLoaded = feedsOk || feedsFailed;

    const hydrated = useRef(false);

    const unresolvedCategoryIds = useRef<string[]>([]);
    const unresolvedFeedIds = useRef<string[]>([]);

    useEffect(() => {
        let cancelled = false;
        hydrated.current = false;
        setCategoriesLoaded(false);

        (async () => {
            try {
                const { items: itemsCategories } = await getCategories({ paginate: false });
                if (!cancelled) setAllCategories(itemsCategories);
            } finally {
                if (!cancelled) setCategoriesLoaded(true);
            }
        })();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const performSearch = () => {
        if (!hydrated.current) return;

        const params = new URLSearchParams(searchParams);

        const categoryIds = [
            ...activeCategories.map(cat => cat.id),
            ...unresolvedCategoryIds.current,
        ];
        const feedIds = [
            ...activeFeeds.map(feed => feed.id),
            ...unresolvedFeedIds.current,
        ];

        // Multi-select: the backend OR-s the comma-separated ids within one param and
        // AND-s the params, i.e. (feed OR feed) AND (category OR category).
        setCategoryIds(params, categoryIds);
        setFeedIds(params, feedIds);

        if (year[0]) params.set('publishedAtGte', year[0].toString());
        else params.delete('publishedAtGte');

        if (year[1]) params.set('publishedAtLte', year[1].toString());
        else params.delete('publishedAtLte');

        if (languageCodes.length > 0) params.set('languageCode', languageCodes.join(','));
        else params.delete('languageCode');

        if (availability.length > 0) params.set('availability', availability.join(','));
        else params.delete('availability');

        setSearchParams(params, { replace: true });
    };

    const performSearchRef = useRef(performSearch);
    performSearchRef.current = performSearch;

    useEffect(() => {
        const publishedAtGte = searchParams.get('publishedAtGte') || '';
        const publishedAtLte = searchParams.get('publishedAtLte') || '';
        const languageCodeParam = searchParams.get('languageCode') || '';
        const availabilityParam = searchParams.get('availability') || '';

        if (year[0] !== publishedAtGte || year[1] !== publishedAtLte) {
            setYear([publishedAtGte, publishedAtLte]);
        }

        const newLanguageCodes = languageCodeParam ? languageCodeParam.split(',') : [];
        if ([...languageCodes].sort().join(',') !== [...newLanguageCodes].sort().join(',')) {
            setLanguageCodes(newLanguageCodes);
        }

        const newAvailability = availabilityParam
            ? (availabilityParam.split(',') as AvailabilityState[])
            : [];
        if ([...availability].sort().join(',') !== [...newAvailability].sort().join(',')) {
            setAvailability(newAvailability);
        }

        const feedIds = readFeedIds(searchParams);
        const matchedFeeds = allFeeds.filter(feed => feedIds.includes(feed.id));
        unresolvedFeedIds.current = feedIds.filter(id => !matchedFeeds.some(f => f.id === id));
        const currentFeedIds = activeFeeds.map(f => f.id).sort().join(',');
        if (currentFeedIds !== matchedFeeds.map(f => f.id).sort().join(',')) {
            setActiveFeeds(matchedFeeds);
        }

        const categoryIds = readCategoryIds(searchParams);
        const matchedCategories = allCategories.filter(cat => categoryIds.includes(cat.id));
        unresolvedCategoryIds.current = categoryIds.filter(id => !matchedCategories.some(c => c.id === id));
        const currentCategoryIds = activeCategories.map(c => c.id).sort().join(',');
        if (currentCategoryIds !== matchedCategories.map(c => c.id).sort().join(',')) {
            setActiveCategories(matchedCategories);
        }

        if (categoriesLoaded && feedsLoaded) hydrated.current = true;
    }, [searchParams, allFeeds, allCategories, categoriesLoaded, feedsLoaded]);

    useEffect(() => {
        const debounce = setTimeout(() => { performSearchRef.current(); }, 300);
        return () => clearTimeout(debounce);
    }, [languageCodes, activeCategories, activeFeeds, availability]);

    useEffect(() => {
        if (yearDebounceTimeout.current) clearTimeout(yearDebounceTimeout.current);
        yearDebounceTimeout.current = setTimeout(() => { performSearchRef.current(); }, 500);
        return () => { if (yearDebounceTimeout.current) clearTimeout(yearDebounceTimeout.current); };
    }, [year]);

    const categoryOptions = useMemo(() =>
        allCategories.map(cat => ({ label: cat.label || cat.term, value: cat.id })),
        [allCategories]
    );

    const feedOptions = useMemo(() =>
        allFeeds.map(feed => ({ label: feed.title, value: feed.id })),
        [allFeeds]
    );

    // Languages that have entries under the current filters (plus the selected ones,
    // so they can be unticked). Falls back to the full ISO list if facets failed.
    const languageOptions = useMemo(() => {
        const locale = i18n.language as AcceptedLanguage;
        const entries = facets.failed
            ? getLanguages(locale).map(lang => ({ value: lang.alpha2 ?? lang.alpha3 ?? '', label: lang.name }))
            : Array.from(new Set([...Object.keys(facets.languageCounts), ...languageCodes]))
                .map(code => ({ value: code, label: getLanguage(code)?.name[locale] ?? code }));
        return entries
            .filter(o => o.value)
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [facets.languageCounts, facets.failed, languageCodes, i18n.language]);

    const handleYearChange = (index: 0 | 1, value: string) => {
        const newYear = [...year];
        newYear[index] = value;
        setYear(newYear);
    };

    const onYearFinish = () => {
        if (yearDebounceTimeout.current) {
            clearTimeout(yearDebounceTimeout.current);
            yearDebounceTimeout.current = null;
        }
        performSearch();
    };

    const availabilityOptions = AVAILABILITY_OPTIONS.map(o => ({
        label: t(o.labelKey),
        value: o.value,
    }));

    return (
        <div className="flex flex-col gap-5 pt-3">
            {/* Dostupnosť */}
            <div className="flex flex-col gap-3">
                <p className="text-[14px] font-medium text-darkGray dark:text-white tracking-[0.1px]">
                    {t('searchBar.availability')}
                </p>
                <div className="flex flex-col gap-[7px]">
                    {availabilityOptions
                        // Like the other facets: hide states with no entries unless selected.
                        .filter(opt => !availabilityCounts || (availabilityCounts[opt.value] ?? 0) > 0 || availability.includes(opt.value as AvailabilityState))
                        .map(opt => (
                        <Checkbox
                            key={opt.value}
                            checked={availability.includes(opt.value as AvailabilityState)}
                            onChange={e => {
                                const val = opt.value as AvailabilityState;
                                setAvailability(e.target.checked
                                    ? [...availability, val]
                                    : availability.filter(v => v !== val)
                                );
                            }}
                            label={
                                <span className={`text-[14px] tracking-[0.1px] leading-[20px] ${availability.includes(opt.value as AvailabilityState) ? 'font-medium' : 'font-normal'} text-darkGray dark:text-white`}>
                                    {opt.label}
                                    {typeof availabilityCounts?.[opt.value] === 'number' && (
                                        <span className="text-[13px] font-normal text-[#b1b1b1] ml-1">({availabilityCounts[opt.value]})</span>
                                    )}
                                </span>
                            }
                        />
                    ))}
                </div>
            </div>

            <SectionDivider />

            {/* Rok vydania */}
            <div className="flex flex-col gap-3">
                <p className="text-[14px] font-medium text-darkGray dark:text-white tracking-[0.1px]">
                    {t('searchBar.yearFromTo')}
                </p>
                <div className="px-1.5 pt-1">
                    <DualRangeSlider
                        min={minYear}
                        // A single-year range would give the slider zero width to work with.
                        max={Math.max(maxYear, minYear + 1)}
                        value={[
                            year[0] ? Number(year[0]) : minYear,
                            year[1] ? Number(year[1]) : maxYear,
                        ]}
                        onChange={([from, to]) => setYear([from.toString(), to.toString()])}
                        onFinish={onYearFinish}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder={prefilledYear(0) || t('searchBar.yearFrom')}
                        value={focusedYear === 0 ? year[0] : (year[0] || prefilledYear(0))}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            if (e.target.value === "" || /^\d*$/.test(e.target.value)) handleYearChange(0, e.target.value);
                        }}
                        onFocus={() => setFocusedYear(0)}
                        onBlur={() => { setFocusedYear(null); onYearFinish(); }}
                        className="w-full min-w-0 px-3 py-1.5 text-[14px] text-darkGray dark:text-white bg-white dark:bg-strongDarkGray border border-[rgba(0,0,0,0.15)] dark:border-[rgba(255,255,255,0.2)] rounded-md outline-none focus:border-primary"
                    />
                    <span className="text-[14px] font-medium text-darkGray dark:text-white flex-shrink-0">-</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder={prefilledYear(1) || t('searchBar.yearTo')}
                        value={focusedYear === 1 ? year[1] : (year[1] || prefilledYear(1))}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            if (e.target.value === "" || /^\d*$/.test(e.target.value)) handleYearChange(1, e.target.value);
                        }}
                        onFocus={() => setFocusedYear(1)}
                        onBlur={() => { setFocusedYear(null); onYearFinish(); }}
                        className="w-full min-w-0 px-3 py-1.5 text-[14px] text-darkGray dark:text-white bg-white dark:bg-strongDarkGray border border-[rgba(0,0,0,0.15)] dark:border-[rgba(255,255,255,0.2)] rounded-md outline-none focus:border-primary"
                    />
                </div>
            </div>

            {/* A facet group with no options to show (no counts, nothing selected)
                is dropped entirely — title and divider included. */}
            {hasOptions(languageOptions, languageCounts, languageCodes) && (
                <>
                    <SectionDivider />
                    <AdvancedCheckboxes
                        title={t('searchBar.language')}
                        options={languageOptions}
                        selected={languageCodes}
                        setSelected={setLanguageCodes}
                        counts={languageCounts}
                    />
                </>
            )}

            {hasOptions(categoryOptions, categoryCounts, activeCategories.map(cat => cat.id)) && (
                <>
                    <SectionDivider />
                    <AdvancedCheckboxes
                        title={t('searchBar.categories')}
                        options={categoryOptions}
                        selected={activeCategories.map(cat => cat.id)}
                        setSelected={selected => {
                            setActiveCategories(allCategories.filter(cat => selected.includes(cat.id)));
                        }}
                        counts={categoryCounts}
                    />
                </>
            )}

            {hasOptions(feedOptions, feedCounts, activeFeeds.map(feed => feed.id)) && (
                <>
                    <SectionDivider />
                    <AdvancedCheckboxes
                        title={t('searchBar.feeds')}
                        enableSearch
                        options={feedOptions}
                        selected={activeFeeds.map(feed => feed.id)}
                        setSelected={selected => {
                            setActiveFeeds(allFeeds.filter(feed => selected.includes(feed.id)));
                        }}
                        counts={feedCounts}
                    />
                </>
            )}
        </div>
    );
}
