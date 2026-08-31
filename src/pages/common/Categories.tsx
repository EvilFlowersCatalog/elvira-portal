import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ICategory } from '../../utils/interfaces/category';
import useGetCategories from '../../hooks/api/categories/useGetCategories';
import ItemContainer from '../../components/items/container/ItemContainer';
import CategoryCard from '../../components/items/categories/CategoryCard';
import LoadNext from '../../components/items/loadings/LoadNext';
import useAppContext from '../../hooks/contexts/useAppContext';
import useInfiniteItemContainer from '../../hooks/api/useInfiniteItemContainer';

const Categories = () => {
  const { selectedCatalogId } = useAppContext();
  const [searchParams] = useSearchParams();

  const { t } = useTranslation();
  const getCategories = useGetCategories();

  const filters = useMemo(
    () => ({ query: searchParams.get('query') ?? '' }),
    [searchParams]
  );

  const list = useInfiniteItemContainer<ICategory>(
    ['categories-infinite', selectedCatalogId, filters],
    () => getCategories({ paginate: false, ...filters })
  );

  return (
    <ItemContainer
      list={list}
      isEntries={false}
      enableSort={false}
      searchSpecifier='query'
      title={t('navbarMenu.categories')}
      shouldRedirectSuggestions={true}
      showResultsHeading={false}
    >
      <div className='flex flex-col px-3 pb-4 gap-4'>
        <div className='flex flex-wrap'>
          {list.items.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
          {list.loadingNext && <LoadNext />}
        </div>
      </div>
    </ItemContainer>
  );
};

export default Categories;
