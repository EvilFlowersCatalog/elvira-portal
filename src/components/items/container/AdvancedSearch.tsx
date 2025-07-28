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
                    sticky top-0 h-fit z-10 pb-20 h-screen
                `}
            >
                <AdvancedSearch  />
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

    const [activeFeeds, setActiveFeeds] = useState<{
        feeds: { title: string; id: string }[];
    }>({ feeds: [] });

    const [activeCategory, setActiveCategory] = useState<{
        categories: ICategory[];
    }>({ categories: [] });

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (title) searchParams.set('title', title);
        else searchParams.delete('title');

        if (author) searchParams.set('author', author);
        else searchParams.delete('author');

        if (activeCategory.categories.length > 0)
            searchParams.set('category-id', activeCategory.categories[0].id);
        else searchParams.delete('category-id');

        if (activeFeeds.feeds.length > 0)
            searchParams.set('feed-id', activeFeeds.feeds[0].id);
        else searchParams.delete('feed-id');

        searchParams.set('publishedAtGte', year[0].toString());
        searchParams.set('publishedAtLte', year[1].toString());

        searchParams.set('language-code', languageCode);

        setSearchParams(searchParams);
    };

    useEffect(() => {
        const title = searchParams.get('title') || '';
        const author = searchParams.get('author') || '';
        const publishedAtGte = searchParams.get('publishedAtGte') || '';
        const publishedAtLte = searchParams.get('publishedAtLte') || '';
        const feedId = searchParams.get('feed-id') || '';
        const categoryId = searchParams.get('category-id') || '';
        const languageCode = searchParams.get('language-code') || '';
        if (title) setTitle(title);
        if (author) setAuthor(author);
        setYear([publishedAtGte, publishedAtLte]);

        if (feedId) setDefaultFeedId(feedId);
        if (categoryId) setDefaultCategoryId(categoryId);
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
            <LanguageAutofill
                defaultLanguageCode={defaultLanguageCode}
                languageCode={languageCode}
                setLanguageCode={setLanguageCode}
                setIsSelectionOpen={()=>{}}
                isRequired={false} />
            <CategoryAutofill
                defaultCategoryId={defaultCategoryId}
                entryForm={activeCategory}
                setEntryForm={setActiveCategory}
                setIsSelectionOpen={() => {}}
                single
            />
            <FeedAutofill
                defaultFeedId={defaultFeedId}
                entryForm={activeFeeds}
                setEntryForm={setActiveFeeds}
                single
            />
        </div>

        <div className='flex justify-end mt-5'>
            <Button type='submit' className='bg-primary dark:bg-primaryLight text-white dark:text-primary'>
                {t('searchBar.search')}
            </Button>
        </div>
    </form>
}