import { useEffect, useState } from 'react';
import { MdAdd } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';
import useGetCategories from '../../hooks/api/categories/useGetCategories';
import ItemContainer from '../../components/items/container/ItemContainer';
import Category from '../../components/items/categories/Category';
import CategoryForm from '../../components/items/categories/CategoryForm';
import useAppContext from '../../hooks/contexts/useAppContext';
import { useTranslation } from 'react-i18next';
import useItemContainer from '../../hooks/useItemContainer';

const AdminCategories = () => {
  const { umamiTrack, selectedCatalogId } = useAppContext();
  const list = useItemContainer<any>();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [reloadPage, setReloadPage] = useState<boolean>(false);

  const { t } = useTranslation();
  const getCategories = useGetCategories();

  useEffect(() => {
    list.reset();
  }, [selectedCatalogId]);

  useEffect(() => {
    list.reset();
  }, [reloadPage]);

  useEffect(() => {
    if (list.page === 0) {
      list.setPage(1);
      return;
    }

    (async () => {
      try {
        const { items, metadata } = await getCategories({
          page: list.page,
          limit: 50,
          query: searchParams.get('query') ?? '',
          orderBy: searchParams.get('order-by') ?? '-created_at',
        });
        list.setMaxPage(metadata.pages);
        list.setItems([...(list.items ?? []), ...items]);
      } catch {
        list.setIsError(true);
      } finally {
        list.setIsLoading(false);
        list.setLoadingNext(false);
      }
    })();
  }, [list.page]);

  return (
    <>
      <ItemContainer
        list={list}
        isEntries={false}
        searchSpecifier="query"
        title={t('administration.homePage.categories.title')}
      >
        <div className='grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 p-4'>
          <div className="w-full">
            <button
              onClick={() => {
                umamiTrack('Add Category Button');
                setIsOpen(true);
              }}
              className="flex flex-col justify-center items-center gap-3 w-full h-full p-8
                rounded-xl border-4 border-dashed border-zinc-300 dark:border-zinc-600
                text-zinc-500 dark:text-zinc-400 hover:text-primary hover:border-primary
                hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
            >
              <MdAdd size={50} />
            </button>
          </div>
          {list.items.map((category, index) => (
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
