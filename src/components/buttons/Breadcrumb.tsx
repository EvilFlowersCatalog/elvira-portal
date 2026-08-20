import { FaHome } from 'react-icons/fa';
import { MdChevronRight } from 'react-icons/md';
import useAppContext from '../../hooks/contexts/useAppContext';
import {
  LANG_TYPE,
  NAVIGATION_PATHS,
} from '../../utils/interfaces/general/general';
import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import useGetFeedDetail from '../../hooks/api/feeds/useGetFeedDetail';
import useGetCategoryDetail from '../../hooks/api/categories/useGetCategoryDetail';

const Breadcrumb = () => {
  const { lang, editingEntryTitle } = useAppContext();
  const [breadcrumbs, setBreadcrumbs] = useState<
    { path: string; label: string }[]
  >([]);
  const [searchParams] = useSearchParams();

  const [feedsLoading, setFeedsLoading] = useState<boolean>(searchParams.get('parent-id') || searchParams.get('feed-id-step') ? true : false);
  const [feeds, setFeeds] = useState<{ id: string; title: string }[]>([]);
  const [authorFilter, setAuthorFilter] = useState<string | null>(searchParams.get('author'));
  const [feedFilter, setFeedFilter] = useState<string | null>(searchParams.get('feeds'));
  const [resolvedFeedFilter, setResolvedFeedFilter] = useState<{ id: string; title: string } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(searchParams.get('categories'));
  const [resolvedCategoryFilters, setResolvedCategoryFilters] = useState<{ id: string; label: string }[]>([]);
  const [feedStep, setFeedStep] = useState<{ id: string; title: string }>({
    id: '',
    title: '',
  });

  const location = useLocation();

  const isEn = (): boolean => {
    return lang === LANG_TYPE.en;
  };

  const breadcrumbsTranslator: { [key: string]: string } = {
    ['library']: isEn() ? 'Library' : 'Knižnica',
    // "Collections" (Zbierky) is the product-wide name for feed resources,
    // in both the public app and admin.
    ['feeds']: isEn() ? 'Collections' : 'Zbierky',
    ['about']: isEn() ? 'About' : 'O Projekte',
    ['administration']: isEn() ? 'Administration' : 'Administrácia',
    ['shelf']: isEn() ? 'Shelf' : 'Polička',
    ['help']: isEn() ? 'Help' : 'Pomoc',
    ['loans']: isEn() ? 'Loans & Reservations' : 'Výpožičky a rezervácie',
    ['entries']: isEn() ? 'Publications' : 'Publikácie',
    ['users']: isEn() ? 'Users' : 'Používatelia',
    ['authors']: isEn() ? 'Authors' : 'Autori',
    ['catalogs']: isEn() ? 'Catalogs' : 'Katalógy',
    ['ai-users']: isEn() ? 'AI Users' : 'AI používatelia',
    ['access']: isEn() ? 'Access & Keys' : 'Prístup a kľúče',
    ['add']: isEn() ? 'Add' : 'Pridanie',
    ['categories']: isEn() ? 'Categories' : 'Kategórie',
    ['edit']: editingEntryTitle,
    ['profile']: isEn() ? 'Profile' : 'Profil',
    ['history']: isEn() ? 'History' : 'História',
    ['ai-chat']: isEn() ? 'AI Assistant' : 'AI Asistent',
    ['ai-chat-history']: isEn() ? 'AI Assistant' : 'AI Asistent',
    ['books']: isEn() ? 'Books' : 'Knihy',
    ['search']: isEn() ? 'Search' : 'Vyhľadávanie',
    ['viewer']: isEn() ? 'PDF Viewer' : 'PDF Viewer',
    ['ai']: isEn() ? 'AI Assistant' : 'AI Asistent',
  };
  const getFeedDetail = useGetFeedDetail();
  const getCategoryDetail = useGetCategoryDetail();

  useEffect(() => {
    // Split the current path into parts
    const pathParts = location.pathname.split('/').filter(Boolean);
    const newBreadcrumbs: { path: string; label: string }[] = [];
    let skip: boolean = false;

    // Generate breadcrumbs based on the path parts
    pathParts.forEach((part, index) => {
      if (skip) return;
      // If we are at edit make it last (skip the id part)
      if (part.toLocaleLowerCase() === 'edit') {
        newBreadcrumbs.push({
          path: `/${pathParts.slice(0, index + 1).join('/')}`,
          label: breadcrumbsTranslator[part.toLocaleLowerCase()], // Capitalize the first letter
        });
        skip = true;
      } else if ((feedsLoading || feeds.length > 0 || resolvedFeedFilter) && pathParts[0] == 'library') {
        newBreadcrumbs.push({
          path: "/feeds",
          label: breadcrumbsTranslator['feeds'],
        });
      }
      else {
        newBreadcrumbs.push({
          path: `/${pathParts.slice(0, index + 1).join('/')}`,
          label: breadcrumbsTranslator[part.toLocaleLowerCase()], // Capitalize the first letter
        });
      }
    });


    if (feeds.length > 0) {
      feeds.map((feed, index) => {
        const previousFeeds = feeds.slice(0, index);
        // %26 is the URL encoded version of &
        const part =
          index !== 0
            ? `?parent-id=${previousFeeds.map((f) => f.id).join('%26')}%26${feed.id}`
            : `?parent-id=${feed.id}`;
        const path = pathParts[0] === 'library' ? "/feeds" + part : `/${pathParts.join('/')}` + part;

        if (!feed.id) return;

        newBreadcrumbs.push({
          path,
          label: feed.title,
        });
      });
    }

    if (feedStep.title) {
      newBreadcrumbs.push({
        path: pathParts.join('/') + `?feed-id-step=${feedStep.id}`,
        label: feedStep.title,
      });
    }

    // Only show filters if no feed hierarchy is active
    if (!feeds.length && !feedStep.title && location.pathname.includes('/library')) {
      // Build current filter params
      const buildFilterPath = (includeFilters: { author?: boolean; feed?: boolean; categories?: boolean }) => {
        const params = new URLSearchParams();
        if (includeFilters.author && authorFilter) params.set('author', authorFilter);
        if (includeFilters.feed && resolvedFeedFilter) params.set('feeds', resolvedFeedFilter.id);
        if (includeFilters.categories && resolvedCategoryFilters.length > 0) {
          params.set('categories', resolvedCategoryFilters.map(c => c.id).join(','));
        }
        return `/${pathParts[0]}?${params.toString()}`;
      };

      // Show author filter
      if (authorFilter) {
        newBreadcrumbs.push({
          path: buildFilterPath({ author: true, feed: !!resolvedFeedFilter, categories: resolvedCategoryFilters.length > 0 }),
          label: authorFilter,
        });
      }
      
      // Show feed filter (resolved)
      if (resolvedFeedFilter) {
        newBreadcrumbs.push({
          path: buildFilterPath({ author: !!authorFilter, feed: true, categories: resolvedCategoryFilters.length > 0 }),
          label: resolvedFeedFilter.title,
        });
      }

      // Show category filters (resolved)
      if (resolvedCategoryFilters.length > 0) {
        resolvedCategoryFilters.forEach((category) => {
          newBreadcrumbs.push({
            path: buildFilterPath({ author: !!authorFilter, feed: !!resolvedFeedFilter, categories: true }),
            label: category.label,
          });
        });
      }
    }

    setBreadcrumbs(newBreadcrumbs);
  }, [location, lang, editingEntryTitle, feeds, feedStep, authorFilter, feedFilter, resolvedFeedFilter, categoryFilter, resolvedCategoryFilters]);

  useEffect(() => {
    const fp = searchParams.get('parent-id')?.split('&');
    const feedStepId = searchParams.get('feed-id-step');
    const feedFilterId = searchParams.get('feeds');
    const categoryFilterIds = searchParams.get('categories');

    setAuthorFilter(searchParams.get('author'));
    setFeedFilter(feedFilterId);
    setCategoryFilter(categoryFilterIds);

    (async () => {
      const feedsPromise = (async () => {
        if (fp) {
          const results = await Promise.all(
            fp.map(async (id) => {
              try {
                const detail = await getFeedDetail(id);
                return { id, title: detail.title };
              } catch {
                return { id, title: 'Feed' };
              }
            })
          );
          setFeeds(results);
        } else {
          setFeeds([]);
        }
      })();

      const feedStepPromise = (async () => {
        if (feedStepId) {
          try {
            const detail = await getFeedDetail(feedStepId);
            setFeedStep({ id: detail.id, title: detail.title });
          } catch {
            setFeedStep({ id: '', title: '' });
          }
        } else {
          setFeedStep({ id: '', title: '' });
        }
      })();

      const feedFilterPromise = (async () => {
        if (feedFilterId && !fp && !feedStepId) {
          try {
            const detail = await getFeedDetail(feedFilterId);
            setResolvedFeedFilter({ id: detail.id, title: detail.title });
          } catch {
            setResolvedFeedFilter(null);
          }
        } else {
          setResolvedFeedFilter(null);
        }
      })();

      const categoryFilterPromise = (async () => {
        if (categoryFilterIds && !fp && !feedStepId) {
          try {
            const categoryIds = categoryFilterIds.split(',');
            const results = await Promise.all(
              categoryIds.map(async (id) => {
                try {
                  const detail = await getCategoryDetail(id);
                  return { id: detail.id, label: detail.label };
                } catch {
                  return null;
                }
              })
            );
            setResolvedCategoryFilters(results.filter((c): c is { id: string; label: string } => c !== null));
          } catch {
            setResolvedCategoryFilters([]);
          }
        } else {
          setResolvedCategoryFilters([]);
        }
      })();

      await Promise.all([feedsPromise, feedStepPromise, feedFilterPromise, categoryFilterPromise]);

      setFeedsLoading(false);
    })();

  }, [location.search]);

  return (
    <div className='flex flex-wrap items-center gap-[7px] px-5 h-10'>
      <Link
        to={NAVIGATION_PATHS.home}
        className='text-darkGray hover:text-secondary dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors shrink-0'
      >
        <FaHome size={18} />
      </Link>
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <span key={index} className='flex items-center gap-[7px]'>
            <MdChevronRight size={13} className='text-darkGray dark:text-zinc-500 shrink-0' />
            {isLast ? (
              <span className='text-[13px] tracking-[0.1px] text-darkGray dark:text-zinc-400 whitespace-nowrap cursor-default'>
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                to={breadcrumb.path}
                className='text-[13px] tracking-[0.1px] text-darkGray dark:text-zinc-400 whitespace-nowrap cursor-pointer hover:text-secondary dark:hover:text-zinc-200 transition-colors'
              >
                {breadcrumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default Breadcrumb;
