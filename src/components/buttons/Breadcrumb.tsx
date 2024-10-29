import { FaHome } from 'react-icons/fa';
import useAppContext from '../../hooks/contexts/useAppContext';
import {
  LANG_TYPE,
  NAVIGATION_PATHS,
} from '../../utils/interfaces/general/general';
import { MdOutlineKeyboardDoubleArrowRight } from 'react-icons/md';
import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import useGetFeedDetail from '../../hooks/api/feeds/useGetFeedDetail';

const Breadcrumb = () => {
  const { specialNavigation, lang, editingEntryTitle } = useAppContext();
  const [breadcrumbs, setBreadcrumbs] = useState<
    { path: string; label: string }[]
  >([]);
  const [searchParams] = useSearchParams();
  const [feeds, setFeeds] = useState<{ id: string; title: string }[]>([]);

  const isEn = (): boolean => {
    return lang === LANG_TYPE.en;
  };

  const breadcrumbsTranslator: { [key: string]: string } = {
    ['library']: isEn() ? 'Library' : 'Knižnica',
    ['feeds']: isEn() ? 'Feeds' : 'Skupiny',
    ['about']: isEn() ? 'About' : 'O Projekte',
    ['administration']: isEn() ? 'Administration' : 'Administrácia',
    ['shelf']: isEn() ? 'Shelf' : 'Polička',
    ['loans']: isEn() ? 'Loans' : 'Výpožičky',
    ['entries']: isEn() ? 'Entries' : 'Publikácie',
    ['add']: isEn() ? 'Add' : 'Pridanie',
    ['categories']: isEn() ? 'Categories' : 'Kategórie',
    ['edit']: editingEntryTitle,
  };

  const location = useLocation();
  const getFeedDetail = useGetFeedDetail();

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
      } else {
        newBreadcrumbs.push({
          path: `/${pathParts.slice(0, index + 1).join('/')}`,
          label: breadcrumbsTranslator[part.toLocaleLowerCase()], // Capitalize the first letter
        });
      }
    });

    if (feeds.length > 0) {
      feeds.map((feed, index) => {
        const part = index === 0 ? `?parent-id=${feed.id}` : `&${feed.id}`;
        const path = pathParts.join('/') + part;

        newBreadcrumbs.push({
          path,
          label: feed.title,
        });
      });
    }

    setBreadcrumbs(newBreadcrumbs);
  }, [location, lang, editingEntryTitle, feeds]);

  useEffect(() => {
    const fp = searchParams.get('parent-id')?.split('&');

    (async () => {
      if (fp) {
        await Promise.all(
          fp.map(async (id) => {
            try {
              const { response: detail } = await getFeedDetail(id);
              return { id, title: detail.title };
            } catch {
              return { id, title: 'Feed' };
            }
          })
        ).then((results) => {
          setFeeds(results);
        });
      } else {
        setFeeds([]);
      }
    })();
  }, [location.search]);

  return (
    <div className='flex gap-3 flex-wrap items-center p-4 pl-5'>
      <button onClick={(e) => specialNavigation(e, NAVIGATION_PATHS.home)}>
        <FaHome size={20} />
      </button>
      {breadcrumbs.map((breadcrumb, index) => (
        <button
          className={`flex gap-3 w-fit items-center text-sm text-left ${
            index === breadcrumbs.length - 1
              ? 'cursor-default'
              : 'cursor-pointer'
          }`}
          key={index}
          onClick={
            index !== breadcrumbs.length - 1
              ? (e) => specialNavigation(e, breadcrumb.path)
              : undefined
          }
        >
          <MdOutlineKeyboardDoubleArrowRight size={15} />
          <span>{breadcrumb.label}</span>
        </button>
      ))}
    </div>
  );
};

export default Breadcrumb;
