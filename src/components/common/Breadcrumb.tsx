import { FaHome } from 'react-icons/fa';
import useAppContext from '../../hooks/contexts/useAppContext';
import {
  LANG_TYPE,
  NAVIGATION_PATHS,
} from '../../utils/interfaces/general/general';
import { MdOutlineKeyboardDoubleArrowRight } from 'react-icons/md';
import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

const Breadcrumb = () => {
  const { specialNavigation, lang, editingEntryTitle } = useAppContext();
  const [breadcrumbs, setBreadcrumbs] = useState<
    { path: string; label: string }[]
  >([]);
  const [searchParams] = useSearchParams();

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
    ['edit']: editingEntryTitle,
  };

  const location = useLocation();

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

    // if there is parent feed in feed page
    const feedParent = searchParams.get('parent-id');
    if (feedParent)
      newBreadcrumbs.push({
        path: '',
        label: isEn() ? 'Sub Feeds' : 'Pod Skupiny',
      });

    setBreadcrumbs(newBreadcrumbs);
  }, [location, lang, editingEntryTitle]);

  return (
    <div className='flex gap-3 flex-wrap items-center p-4'>
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
