import { useEffect, useState } from 'react';
import { MdAdd } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';
import useGetCategories from '../../hooks/api/categories/useGetCategories';
import ItemContainer from '../../components/items/container/ItemContainer';
import Category from '../../components/items/categories/Category';
import CategoryForm from '../../components/items/categories/CategoryForm';
import useAppContext from '../../hooks/contexts/useAppContext';
import { useTranslation } from 'react-i18next';

const AdminCategories = () => {
  const { stuBorder, stuBg, umamiTrack } = useAppContext();

  const [categories, setCategories] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [reloadPage, setReloadPage] = useState<boolean>(false);

  const { t } = useTranslation();
  const getCategories = useGetCategories();

  // When searchParams change or is triggered reload -> Reset page
  useEffect(() => {
    setPage(0);
    setCategories([]);
    setIsLoading(true);
  }, [reloadPage]);

  useEffect(() => {
    if (page === 0) {
      setPage(1);
      return;
    }

    (async () => {
      try {
        const { items, metadata } = await getCategories({
          page,
          limit: 50,
          query: searchParams.get('query') ?? '',
          orderBy: searchParams.get('order-by') ?? '-created_at',
        });
        // Set items and metadata
        setMaxPage(metadata.pages);
        setCategories([...(categories ?? []), ...items]);
      } catch {
        // if there was error set to true
        setIsError(true);
      } finally {
        // after everything set false
        setIsLoading(false);
        setLoadingNext(false);
      }
    })();
  }, [page]);

  return (
    <>
      <ItemContainer
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        isError={isError}
        items={categories}
        setItems={setCategories}
        page={page}
        setPage={setPage}
        maxPage={maxPage}
        loadingNext={loadingNext}
        setLoadingNext={setLoadingNext}
        isEntries={false}
        showEmpty={false}
        searchSpecifier={'query'}
        title={t('administration.homePage.categories.title')}
      >
        <div className='grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 p-4'>
          {/* Add button */}
          <div className={'w-full'}>
            <button
              onClick={() => {
                umamiTrack('Add Category Button');
                setIsOpen(true);
              }}
              className={`flex flex-col justify-center items-center gap-3 w-full h-full p-8 
        rounded-xl border-4 border-dashed border-zinc-300 dark:border-zinc-600 
        text-zinc-500 dark:text-zinc-400 hover:text-primary hover:border-primary 
        hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200`}>
              <MdAdd size={50} />
            </button>
          </div>

          {categories.map((category, index) => (
            <Category
              key={index}
              category={category}
              reloadPage={reloadPage}
              setReloadPage={setReloadPage}
            />
          ))}
        </div>
      </ItemContainer>
      {isOpen && (
        <CategoryForm
          setOpen={setIsOpen}
          reloadPage={reloadPage}
          setReloadPage={setReloadPage}
        />
      )}
    </>
  );
};

export default AdminCategories;
