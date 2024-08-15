import { useEffect, useState } from 'react';
import { MdAdd } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';
import useGetCategories from '../../../hooks/api/categories/useGetCategories';
import ItemContainer from '../../../components/items-container/ItemContainer';
import Category from './components/Category';
import CategoryForm from './components/CategoryForm';

const AdminCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [reloadPage, setReloadPage] = useState<boolean>(false);

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
      >
        <div className='flex flex-wrap px-3 pb-4'>
          {/* Add button */}
          <div className={'w-full p-2 flex md:w-1/2 lg:w-1/4 xl:w-1/5'}>
            <button
              onClick={() => setIsOpen(true)}
              className={`flex flex-col justify-center dark:text-white text-black items-center p-2 w-full rounded-md border-4 border-dashed border-spacing-8 border-STUColor bg-STUColor bg-opacity-40 hover:bg-opacity-20 duration-200`}
            >
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
