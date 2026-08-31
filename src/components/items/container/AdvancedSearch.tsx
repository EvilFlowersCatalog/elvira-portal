import { useSearchParams } from "react-router-dom";
import useAppContext from "../../../hooks/contexts/useAppContext"
import { useTranslation } from "react-i18next";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { ICategory } from "../../../utils/interfaces/category";
import CategoryAutofill from "../../autofills/CategoryAutofill";
import FeedAutofill from "../../autofills/FeedAutofill";
import { IoClose } from "react-icons/io5";
import AdvancedCheckboxes from "../../inputs/AdvancedCheckboxes";
import Checkbox from "../../primitives/Checkbox";
import DualRangeSlider from "../../primitives/DualRangeSlider";
import useGetCategories from "../../../hooks/api/categories/useGetCategories";
import useFeedsQuery from "../../../hooks/api/feeds/useFeedsQuery";
import useGetEntries from "../../../hooks/api/entries/useGetEntries";
import useEntryFacets from "../../../hooks/api/entries/useEntryFacets";
import { AcceptedLanguage, getLanguage, getLanguages } from "../../../hooks/api/languages/languages";
import { IFeed } from "../../../utils/interfaces/feed";
import { AvailabilityState } from "../entry/details/AvailabilityBadge";

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

export function AdvancedSearchWrapper({ children }: { children: React.ReactNode }) {
    const { showAdvancedSearch, setShowAdvancedSearch } = useAppContext();
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
                <AdvancedSearch />
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
                <AdvancedSearch />
            </div>
            <div className="w-full pt-3">
                {children}
            </div>
        </div>
    );
}

export function AdvancedSearch() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { t, i18n } = useTranslation();

    const [year, setYear] = useState<string[]>(["", ""]);
    const [languageCodes, setLanguageCodes] = useState<string[]>([]);
    const [availability, setAvailability] = useState<AvailabilityState[]>([]);
    const yearDebounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentYear = new Date().getFullYear();
    const [minYear, setMinYear] = useState<number>(DEFAULT_MIN_YEAR);

    const getEntries = useGetEntries();
    const getCategories = useGetCategories();
    const facets = useEntryFacets();
    const [allCategories, setAllCategories] = useState<ICategory[]>([]);
    const [activeCategories, setActiveCategories] = useState<ICategory[]>([]);

    const [activeFeeds, setActiveFeeds] = useState<IFeed[]>([]);

    // Collections list (cached/deduped by React Query).
    const { data: feedsData } = useFeedsQuery({ paginate: false });
    const allFeeds = useMemo<IFeed[]>(() => feedsData?.items ?? [], [feedsData]);

    useEffect(() => {
        (async () => {
            const { items: itemsCategories } = await getCategories({ paginate: false });
            setAllCategories(itemsCategories);
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const { items } = await getEntries({ page: 1, limit: 1, orderBy: 'published_at' });
                const earliest = items[0]?.published_at ? new Date(items[0].published_at).getFullYear() : NaN;
                if (!Number.isNaN(earliest) && earliest > 0) setMinYear(earliest);
            } catch {
                // Falls back to DEFAULT_MIN_YEAR when the earliest year can't be determined.
            }
        })();
    }, []);

    const performSearch = () => {
        if (import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true') {
            if (activeCategories.length > 0) {
                searchParams.set('categories', activeCategories.map(cat => cat.id).join(','));
            } else {
                searchParams.delete('categories');
            }
            searchParams.delete('category-id');

            if (activeFeeds.length > 0) {
                searchParams.set('feeds', activeFeeds.map(feed => feed.id).join(','));
            } else {
                searchParams.delete('feeds');
            }
            searchParams.delete('feed-id');
        } else {
            const singleCategory = activeCategories[0];
            if (singleCategory) {
                searchParams.set('category-id', singleCategory.id);
            } else {
                searchParams.delete('category-id');
            }
            searchParams.delete('categories');

            const singleFeed = activeFeeds[0];
            if (singleFeed) {
                searchParams.set('feed-id', singleFeed.id);
            } else {
                searchParams.delete('feed-id');
            }
            searchParams.delete('feeds');
        }

        if (year[0]) searchParams.set('publishedAtGte', year[0].toString());
        else searchParams.delete('publishedAtGte');

        if (year[1]) searchParams.set('publishedAtLte', year[1].toString());
        else searchParams.delete('publishedAtLte');

        if (languageCodes.length > 0) searchParams.set('languageCode', languageCodes.join(','));
        else searchParams.delete('languageCode');

        if (availability.length > 0) searchParams.set('availability', availability.join(','));
        else searchParams.delete('availability');

        setSearchParams(searchParams);
    };

    useEffect(() => {
        const publishedAtGte = searchParams.get('publishedAtGte') || '';
        const publishedAtLte = searchParams.get('publishedAtLte') || '';
        const languageCodeParam = searchParams.get('languageCode') || '';
        const availabilityParam = searchParams.get('availability') || '';

        const isExperimental = import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true';
        const feedsParam = isExperimental
            ? (searchParams.get('feeds') || '')
            : (searchParams.get('feed-id') || '');
        const categoriesParam = isExperimental
            ? (searchParams.get('categories') || '')
            : (searchParams.get('category-id') || '');

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
        if (availability.sort().join(',') !== newAvailability.sort().join(',')) {
            setAvailability(newAvailability);
        }

        const feedIds = feedsParam ? feedsParam.split(',') : [];
        const currentFeedIds = activeFeeds.map(f => f.id).sort().join(',');
        if (currentFeedIds !== [...feedIds].sort().join(',')) {
            setActiveFeeds(feedsParam ? allFeeds.filter(feed => feedIds.includes(feed.id)) : []);
        }

        const categoryIds = categoriesParam ? categoriesParam.split(',') : [];
        const currentCategoryIds = activeCategories.map(c => c.id).sort().join(',');
        if (currentCategoryIds !== [...categoryIds].sort().join(',')) {
            setActiveCategories(categoriesParam ? allCategories.filter(cat => categoryIds.includes(cat.id)) : []);
        }
    }, [searchParams, allFeeds, allCategories]);

    useEffect(() => {
        const debounce = setTimeout(() => { performSearch(); }, 300);
        return () => clearTimeout(debounce);
    }, [languageCodes, activeCategories, activeFeeds, availability]);

    useEffect(() => {
        if (yearDebounceTimeout.current) clearTimeout(yearDebounceTimeout.current);
        yearDebounceTimeout.current = setTimeout(() => { performSearch(); }, 500);
        return () => { if (yearDebounceTimeout.current) clearTimeout(yearDebounceTimeout.current); };
    }, [year]);

    const categoryOptions = useMemo(() =>
        allCategories.map(cat => ({ label: cat.term, value: cat.id })),
        [allCategories]
    );

    const feedOptions = useMemo(() =>
        allFeeds.map(feed => ({ label: feed.title, value: feed.id })),
        [allFeeds]
    );

    // Languages present in the catalog (from the facet sample); falls back to the
    // full ISO list until the sample is available so the filter still works.
    const languageOptions = useMemo(() => {
        const locale = i18n.language as AcceptedLanguage;
        const sampledCodes = Object.keys(facets.languageCounts);
        const entries = sampledCodes.length > 0
            ? sampledCodes.map(code => ({ value: code, label: getLanguage(code)?.name[locale] ?? code }))
            : getLanguages(locale).map(lang => ({ value: lang.alpha2 ?? lang.alpha3 ?? '', label: lang.name }));
        return entries
            .filter(o => o.value)
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [facets.languageCounts, i18n.language]);

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
                    {availabilityOptions.map(opt => (
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
                        max={currentYear}
                        value={[
                            year[0] ? Number(year[0]) : minYear,
                            year[1] ? Number(year[1]) : currentYear,
                        ]}
                        onChange={([from, to]) => setYear([from.toString(), to.toString()])}
                        onFinish={onYearFinish}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder={t('searchBar.yearFrom')}
                        value={year[0]}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            if (e.target.value === "" || /^\d*$/.test(e.target.value)) handleYearChange(0, e.target.value);
                        }}
                        onBlur={onYearFinish}
                        className="w-full min-w-0 px-3 py-1.5 text-[14px] text-darkGray dark:text-white bg-white dark:bg-strongDarkGray border border-[rgba(0,0,0,0.15)] dark:border-[rgba(255,255,255,0.2)] rounded-md outline-none focus:border-primary"
                    />
                    <span className="text-[14px] font-medium text-darkGray dark:text-white flex-shrink-0">-</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder={t('searchBar.yearTo')}
                        value={year[1]}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            if (e.target.value === "" || /^\d*$/.test(e.target.value)) handleYearChange(1, e.target.value);
                        }}
                        onBlur={onYearFinish}
                        className="w-full min-w-0 px-3 py-1.5 text-[14px] text-darkGray dark:text-white bg-white dark:bg-strongDarkGray border border-[rgba(0,0,0,0.15)] dark:border-[rgba(255,255,255,0.2)] rounded-md outline-none focus:border-primary"
                    />
                </div>
            </div>

            <SectionDivider />
            <AdvancedCheckboxes
                title={t('searchBar.language')}
                options={languageOptions}
                selected={languageCodes}
                setSelected={setLanguageCodes}
                counts={Object.keys(facets.languageCounts).length ? facets.languageCounts : undefined}
            />

            <SectionDivider />
            <AdvancedCheckboxes
                title={t('searchBar.categories')}
                options={categoryOptions}
                selected={activeCategories.map(cat => cat.id)}
                setSelected={selected => {
                    setActiveCategories(allCategories.filter(cat => selected.includes(cat.id)));
                }}
                counts={Object.keys(facets.categoryCounts).length ? facets.categoryCounts : undefined}
            />

            <SectionDivider />
            <AdvancedCheckboxes
                title={t('searchBar.feeds')}
                enableSearch
                options={feedOptions}
                selected={activeFeeds.map(feed => feed.id)}
                setSelected={selected => {
                    setActiveFeeds(allFeeds.filter(feed => selected.includes(feed.id)));
                }}
                counts={Object.keys(facets.feedCounts).length ? facets.feedCounts : undefined}
            />
        </div>
    );
}
