import { FaHome } from 'react-icons/fa';
import useAppContext from '../../hooks/contexts/useAppContext';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { MdOutlineKeyboardDoubleArrowRight } from 'react-icons/md';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const Breadcrumb = () => {
  const { specialNavigation } = useAppContext();
  const [breadcrumbs, setBreadcrumbs] = useState<
    { path: string; label: string }[]
  >([]);

  const location = useLocation();

  useEffect(() => {
    // Split the current path into parts
    const pathParts = location.pathname.split('/').filter(Boolean);

    // Generate breadcrumbs based on the path parts
    const newBreadcrumbs = pathParts.map((part, index) => ({
      path: `/${pathParts.slice(0, index + 1).join('/')}`,
      label: part.charAt(0).toUpperCase() + part.slice(1), // Capitalize the first letter
    }));

    setBreadcrumbs(newBreadcrumbs);
  }, [location]);

  return (
    <div className='flex gap-3 flex-wrap text-right items-center p-4 '>
      <button onClick={(e) => specialNavigation(e, NAVIGATION_PATHS.home)}>
        <FaHome size={20} />
      </button>
      {breadcrumbs.map((breadcrumb, index) => (
        <button
          className={`flex gap-3 w-fit h-full items-center text-sm ${
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
