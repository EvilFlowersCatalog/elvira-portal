import { useSearchParams } from "react-router-dom";
import useAppContext from "../../../hooks/contexts/useAppContext"
import { useTranslation } from "react-i18next";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
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
        <div className="flex flex-col md:flex-row border-t-2 border-gray-300 dark:border-gray-700">
            {/* Desktop sidebar */}
            <div
                className={`
                    hidden md:block
                    border-r-2 border-gray-300 dark:border-gray-700
                    transition-all duration-500 ease-in-out 
                    overflow-auto ${showAdvancedSearch ? 'max-w-[300px] opacity-100 p-3' : 'max-w-0 opacity-0'} w-full
                    sticky top-0 h-fit z-10 pb-32 h-screen
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
                    bg-slate-200 dark:bg-gray
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

    const [defaultLanguageCode, setDefaultLanguageCode] = useState<string>('');
    const [defaultCategoryId, setDefaultCategoryId] = useState<string>('');
    const [defaultFeedId, setDefaultFeedId] = useState<string>('');

    const [title, setTitle] = useState<string>('');
    const [author, setAuthor] = useState<string>('');
    const [year, setYear] = useState<string[]>(["", ""]);
    const [languageCode, setLanguageCode] = useState<string>('');

    const [activeCategory, setActiveCategory] = useState<{
        categories: ICategory[];
    }>({ categories: [] });


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

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (title) searchParams.set('title', title);
        else searchParams.delete('title');

        if (author) searchParams.set('author', author);
        else searchParams.delete('author');

        // if (activeCategory.categories.length > 0)
        //     searchParams.set('category-id', activeCategory.categories[0].id);
        // else searchParams.delete('category-id');
        // if (activeFeeds.feeds.length > 0)
        //     searchParams.set('feed-id', activeFeeds.feeds[0].id);
        // else searchParams.delete('feed-id');

        if(activeCategories.length > 0) {
            searchParams.set('categories', activeCategories.map(cat => cat.id).join(','));
        } else searchParams.delete('categories');

        if(activeFeeds.length > 0) {
            searchParams.set('feeds', activeFeeds.map(feed => feed.id).join(','));
        } else searchParams.delete('feeds');


        searchParams.set('publishedAtGte', year[0].toString());
        searchParams.set('publishedAtLte', year[1].toString());

        searchParams.set('languageCode', languageCode);

        setSearchParams(searchParams);
    };

    useEffect(() => {
        const title = searchParams.get('title') || '';
        const author = searchParams.get('author') || '';
        const publishedAtGte = searchParams.get('publishedAtGte') || '';
        const publishedAtLte = searchParams.get('publishedAtLte') || '';
        // const feedId = searchParams.get('feed-id') || '';
        // const categoryId = searchParams.get('category-id') || '';
        const feeds = searchParams.get('feeds') || '';
        const categories = searchParams.get('categories') || '';
        const languageCode = searchParams.get('languageCode') || '';
        if (title) setTitle(title);
        if (author) setAuthor(author);
        setYear([publishedAtGte, publishedAtLte]);

        if (feeds) setActiveFeeds(allFeeds.filter(feed => feeds.split(',').includes(feed.id)));
        if (categories) setActiveCategories(allCategories.filter(cat => categories.split(',').includes(cat.id)));
        if (languageCode) setDefaultLanguageCode(languageCode);
    }, [searchParams]);

    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const handleAuthorChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAuthor(e.target.value);
    };

    return <form
        onSubmit={onSubmit}>
        <div className='flex flex-col gap-2'>
            <ElviraInput
                placeholder={t('searchBar.title')}
                value={title}
                onChange={handleTitleChange}
            />
            <ElviraInput
                placeholder={t('searchBar.author')}
                value={author}
                onChange={handleAuthorChange}
            />

            <div className='flex gap-2'>

                <ElviraNumberInput
                    placeholder={t('searchBar.yearFrom')}
                    value={year[0].toString()} onChange={function (e: ChangeEvent<HTMLInputElement>): void {
                        setYear([e.target.value, year[1]]);
                    }} />

                <ElviraNumberInput
                    placeholder={t('searchBar.yearTo')}
                    value={year[1].toString()}
                    onChange={function (e: ChangeEvent<HTMLInputElement>): void {
                        setYear([year[0], e.target.value]);
                    }}
                />
            </div>

            <LanguageAutofill
                defaultLanguageCode={defaultLanguageCode}
                languageCode={languageCode}
                setLanguageCode={setLanguageCode}
                setIsSelectionOpen={() => { }}
                isRequired={false} />
            {/* <CategoryAutofill
                defaultCategoryId={defaultCategoryId}
                entryForm={activeCategory}
                setEntryForm={setActiveCategory}
                setIsSelectionOpen={() => { }}
                single
            />
            
            <FeedAutofill
                defaultFeedId={defaultFeedId}
                entryForm={activeFeeds}
                setEntryForm={setActiveFeeds}
                single
            /> */}

            <AdvancedCheckboxes
                title={t('searchBar.categories')}
                options={allCategories.map(cat => ({ label: cat.term, value: cat.id }))}
                selected={activeCategories.map(cat => cat.id)}
                setSelected={(selected) => {
                    const selectedCategories = allCategories.filter(cat => selected.includes(cat.id));
                    setActiveCategories(selectedCategories);
                }}
                />
           
            <AdvancedCheckboxes
                title={t('searchBar.feeds')}
                enableSearch
                options={allFeeds.map(feed => ({ label: feed.title, value: feed.id }))}
                selected={activeFeeds.map(feed => feed.id)}
                setSelected={(selected) => {
                    const selectedFeeds = allFeeds.filter(feed => selected.includes(feed.id));
                    setActiveFeeds(selectedFeeds);
                }}
            />
        </div>

        <div className='flex justify-end mt-5'>
            <Button type='submit'  className='!bg-secondary !text-white dark:!bg-primaryLight dark:!text-primary'>
                {t('searchBar.search')}
            </Button>
        </div>
    </form>
}