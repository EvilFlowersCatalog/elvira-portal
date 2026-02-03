import { useSearchParams } from "react-router-dom";
import useAppContext from "../../../hooks/contexts/useAppContext"
import { useTranslation } from "react-i18next";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { ICategory } from "../../../utils/interfaces/category";
import ElviraInput from "../../inputs/ElviraInput";
import LanguageAutofill from "../../autofills/LanguageAutofill";
import CategoryAutofill from "../../autofills/CategoryAutofill";
import FeedAutofill from "../../autofills/FeedAutofill";
import { Button } from "@mui/material";
import ElviraNumberInput from "../../inputs/ElviraNumberInput";
import { IoClose } from "react-icons/io5";
import AdvancedCheckboxes from "../../inputs/AdvancedCheckboxes";
import useGetCategories from "../../../hooks/api/categories/useGetCategories";
import useGetFeeds from "../../../hooks/api/feeds/useGetFeeds";
import { IFeed } from "../../../utils/interfaces/feed";

export function AdvancedSearchWrapper({ children }: { children: React.ReactNode }) {
    const { showAdvancedSearch, setShowAdvancedSearch } = useAppContext();
    return (
        <div className="flex flex-col md:flex-row">
            {/* Desktop sidebar */}
            <div
                className={`
                    hidden md:block
                    border-r-2 border-gray-300 dark:border-gray-700
                    transition-all duration-500 ease-in-out 
                    overflow-auto ${showAdvancedSearch ? 'max-w-[300px] opacity-100 p-3' : 'max-w-0 opacity-0'} w-full
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
                    ${showAdvancedSearch ? 'top-0 bottom-0 opacity-100 p-3' : '-top-full opacity-0 pointer-events-none'}
                    rounded-none h-screen
                `}
            >
                <div className="pt-4">
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
    const { t } = useTranslation();

    const [year, setYear] = useState<string[]>(["", ""]);
    const [languageCode, setLanguageCode] = useState<string>('');
    const yearDebounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const getCategories = useGetCategories();
    const [allCategories, setAllCategories] = useState<ICategory[]>([]);
    const [activeCategories, setActiveCategories] = useState<ICategory[]>([]);

    const getFeeds = useGetFeeds();
    const [allFeeds, setAllFeeds] = useState<IFeed[]>([]);
    const [activeFeeds, setActiveFeeds] = useState<IFeed[]>([]);

    useEffect(() => {
        (async () => {
            const { items: itemsCategories } = await getCategories({
                paginate: false,
            });
            const { items: itemsFeeds } = await getFeeds({
                paginate: false,
            });
            setAllFeeds(itemsFeeds);
            setAllCategories(itemsCategories);
        })();
    }, []);

    const performSearch = () => {
        // Only handle filters that exist in AdvancedSearch component
        if (activeCategories.length > 0) {
            searchParams.set('categories', activeCategories.map(cat => cat.id).join(','));
        } else {
            searchParams.delete('categories');
        }

        if (activeFeeds.length > 0) {
            searchParams.set('feeds', activeFeeds.map(feed => feed.id).join(','));
        } else {
            searchParams.delete('feeds');
        }

        if (year[0]) {
            searchParams.set('publishedAtGte', year[0].toString());
        } else {
            searchParams.delete('publishedAtGte');
        }

        if (year[1]) {
            searchParams.set('publishedAtLte', year[1].toString());
        } else {
            searchParams.delete('publishedAtLte');
        }

        if (languageCode) {
            searchParams.set('languageCode', languageCode);
        } else {
            searchParams.delete('languageCode');
        }

        setSearchParams(searchParams);
    };

    useEffect(() => {
        const publishedAtGte = searchParams.get('publishedAtGte') || '';
        const publishedAtLte = searchParams.get('publishedAtLte') || '';
        const feeds = searchParams.get('feeds') || '';
        const categories = searchParams.get('categories') || '';
        const languageCodeParam = searchParams.get('languageCode') || '';
        
        // Only update if values actually changed
        if (year[0] !== publishedAtGte || year[1] !== publishedAtLte) {
            setYear([publishedAtGte, publishedAtLte]);
        }
        
        if (languageCode !== languageCodeParam) {
            setLanguageCode(languageCodeParam);
        }

        // Update feeds only if the IDs actually changed
        const feedIds = feeds ? feeds.split(',') : [];
        const currentFeedIds = activeFeeds.map(f => f.id).sort().join(',');
        const newFeedIds = feedIds.sort().join(',');
        
        if (currentFeedIds !== newFeedIds) {
            if (feeds) {
                setActiveFeeds(allFeeds.filter(feed => feedIds.includes(feed.id)));
            } else {
                setActiveFeeds([]);
            }
        }

        // Update categories only if the IDs actually changed
        const categoryIds = categories ? categories.split(',') : [];
        const currentCategoryIds = activeCategories.map(c => c.id).sort().join(',');
        const newCategoryIds = categoryIds.sort().join(',');
        
        if (currentCategoryIds !== newCategoryIds) {
            if (categories) {
                setActiveCategories(allCategories.filter(cat => categoryIds.includes(cat.id)));
            } else {
                setActiveCategories([]);
            }
        }
    }, [searchParams, allFeeds, allCategories]);

    // Trigger search when advanced options change (debounced for checkbox/select changes)
    useEffect(() => {
        const debounce = setTimeout(() => {
            performSearch();
        }, 300);
        return () => clearTimeout(debounce);
    }, [languageCode, activeCategories, activeFeeds]);

    // Debounce year changes
    useEffect(() => {
        if (yearDebounceTimeout.current) {
            clearTimeout(yearDebounceTimeout.current);
        }
        yearDebounceTimeout.current = setTimeout(() => {
            performSearch();
        }, 500);
        
        return () => {
            if (yearDebounceTimeout.current) {
                clearTimeout(yearDebounceTimeout.current);
            }
        };
    }, [year]);

    // Memoize options to prevent unnecessary re-renders in AdvancedCheckboxes
    const categoryOptions = useMemo(() => 
        allCategories.map(cat => ({ label: cat.term, value: cat.id })),
        [allCategories]
    );

    const feedOptions = useMemo(() => 
        allFeeds.map(feed => ({ label: feed.title, value: feed.id })),
        [allFeeds]
    );

    const handleYearChange = (index: 0 | 1, value: string) => {
        const newYear = [...year];
        newYear[index] = value;
        setYear(newYear);
    };

    const onYearFinish = () => {
        // Cancel pending debounce and search immediately
        if (yearDebounceTimeout.current) {
            clearTimeout(yearDebounceTimeout.current);
            yearDebounceTimeout.current = null;
        }
        performSearch();
    };

    return <div className='flex flex-col gap-2'>
        <h2 className="text-[15px] capitalize font-bold">{t('searchBar.yearFromTo')}</h2>
        <div className='flex gap-2'>
            <ElviraNumberInput
                placeholder={t('searchBar.yearFrom')}
                value={year[0].toString()} 
                onChange={function (e: ChangeEvent<HTMLInputElement>): void {
                    handleYearChange(0, e.target.value);
                }}
                onBlur={onYearFinish}
            />

            <ElviraNumberInput
                placeholder={t('searchBar.yearTo')}
                value={year[1].toString()}
                onChange={function (e: ChangeEvent<HTMLInputElement>): void {
                    handleYearChange(1, e.target.value);
                }}
                onBlur={onYearFinish}
            />
        </div>

        <div className="h-[1px] w-full bg-gray-300 my-4"></div>

        <LanguageAutofill
            defaultLanguageCode={languageCode}
            languageCode={languageCode}
            setLanguageCode={setLanguageCode}
            setIsSelectionOpen={() => { }}
            isRequired={false} />
        
        {import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true' ? (
            <>
            <div className="h-[1px] w-full bg-gray-300 my-4"></div>
            <AdvancedCheckboxes
                title={t('searchBar.categories')}
                options={categoryOptions}
                selected={activeCategories.map(cat => cat.id)}
                setSelected={(selected) => {
                    const selectedCategories = allCategories.filter(cat => selected.includes(cat.id));
                    setActiveCategories(selectedCategories);
                }}
                />
           
        <div className="h-[1px] w-full bg-gray-300 my-4"></div>
            <AdvancedCheckboxes
                title={t('searchBar.feeds')}
                enableSearch
                options={feedOptions}
                selected={activeFeeds.map(feed => feed.id)}
                setSelected={(selected) => {
                    const selectedFeeds = allFeeds.filter(feed => selected.includes(feed.id));
                    setActiveFeeds(selectedFeeds);
                }}
            />
          </>
        ) : null}
    </div>
}