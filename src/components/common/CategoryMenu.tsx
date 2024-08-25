import { MdRemoveCircle } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { CircleLoader } from 'react-spinners';
import useAppContext from '../../hooks/contexts/useAppContext';
import useCustomEffect from '../../hooks/useCustomEffect';
import { useState } from 'react';
import { ICategory } from '../../utils/interfaces/category';
import useGetCategories from '../../hooks/api/categories/useGetCategories';

interface ICategoryMenuParams {
  activeCategories: ICategory[];
  setActiveCategories: (activeCategories: ICategory[]) => void;
  searchBar?: boolean;
}
const CategoryMenu = ({
  activeCategories,
  setActiveCategories,
  searchBar = false,
}: ICategoryMenuParams) => {
  const { t } = useTranslation();
  const { STUColor } = useAppContext();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getCategories = useGetCategories();

  useCustomEffect(() => {
    (async () => {
      try {
        const { items } = await getCategories({
          paginate: false,
        });
        setCategories(items);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return isLoading ? (
    <div className='flex flex-1 justify-center items-center'>
      <CircleLoader color={STUColor} size={50} />
    </div>
  ) : categories.length === 0 ? (
    <div className='flex h-40 items-center justify-center text-center text-xl font-extrabold'>
      {t('modal.feedMenu.empty')}
    </div>
  ) : (
    <>
      <span className='font-bold pl-1 text-left w-full'>
        {t('modal.categoryMenu.selected')}
      </span>
      <div className='flex w-full flex-wrap mb-2'>
        {activeCategories.map((category, index) => (
          <div key={index} className={`${searchBar ? 'w-full' : ''} p-1`}>
            <button
              type='button'
              className='bg-STUColor p-2 text-sm hover:bg-red w-full h-full flex gap-2 justify-between items-center text-white rounded-md'
              onClick={() =>
                setActiveCategories(
                  // Return only those which id does not equal
                  activeCategories.filter((ac) => ac.id !== category.id)
                )
              }
            >
              {category.term}
              <MdRemoveCircle size={15} />
            </button>
          </div>
        ))}
      </div>
      <span className='font-bold pl-1 text-left w-full'>
        {t('modal.categoryMenu.options')}
      </span>
      <div className='flex w-full flex-wrap'>
        {categories.map((category, index) => (
          <div key={index} className={`${searchBar ? 'w-1/2' : ''} p-1`}>
            <button
              type='button'
              className='bg-black text-white dark:bg-white dark:text-black hover:bg-opacity-50 dark:hover:bg-opacity-50 w-full h-full py-2 px-4 flex justify-center items-center rounded-md'
              onClick={() => {
                if (searchBar) {
                  setActiveCategories([category]);
                } else {
                  // Check if a feed with the same ID already exists
                  const existingFeed = activeCategories.find(
                    (prevCategory) => prevCategory.id === category.id
                  );
                  // If no feed with the same ID exists, add the new feed
                  if (!existingFeed) {
                    setActiveCategories([...activeCategories, category]);
                  }
                  // If a feed with the same ID exists, return the previous state unchanged
                  else setActiveCategories(activeCategories);
                }
              }}
            >
              {category.term}
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default CategoryMenu;
