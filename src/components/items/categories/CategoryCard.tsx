import { useNavigate } from 'react-router-dom';
import { FaTag } from 'react-icons/fa6';
import { ICategory } from '../../../utils/interfaces/category';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import useAppContext from '../../../hooks/contexts/useAppContext';

interface ICategoryCardParams {
  category: ICategory;
}

const CategoryCard = ({ category }: ICategoryCardParams) => {
  const { umamiTrack } = useAppContext();
  const navigate = useNavigate();

  const handleCategoryClick = () => {
    umamiTrack('Category Button', {
      categoryId: category.id,
    });

    const params = new URLSearchParams();
    if (import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true') {
      params.set('categories', category.id);
    } else {
      params.set('category-id', category.id);
    }
    // Marks the provenance so Breadcrumb can tell this apart from a facet tick.
    params.set('from', 'categories');

    navigate({
      pathname: NAVIGATION_PATHS.library,
      search: params.toString(),
    });
  };

  return (
    <div className={'relative flex p-2 w-full md:w-1/2 xl:w-1/4'}>
      <button
        className={`relative h-[126px] w-full bg-primaryLight text-left rounded-[8px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)] p-4 flex flex-col gap-2 duration-200 overflow-hidden hover:brightness-95`}
        onClick={() => handleCategoryClick()}
      >
        <div className='absolute top-4 right-4 pointer-events-none text-secondary'>
          <FaTag size={24} />
        </div>
        <span className='text-base font-bold text-secondary leading-[1.4] pr-10 line-clamp-2'>
          {category.label || category.term}
        </span>
      </button>
    </div>
  );
};

export default CategoryCard;
