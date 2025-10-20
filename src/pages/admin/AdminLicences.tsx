import { useEffect, useState } from 'react';
import ItemContainer from '../../components/items/container/ItemContainer';
import useGetLicenses from '../../hooks/api/licenses/useGetLicenses';
import { ILicense } from '../../utils/interfaces/licenses';
import LoadNext from '../../components/items/loadings/LoadNext';
import { useSearchParams } from 'react-router-dom';
import AdminLicense from '../../components/items/licenses/AdminLicense';

const AdminLicences = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [licenses, setLicenses] = useState<ILicense[]>([]);
  const [searchParams] = useSearchParams();
  const [reloadPage, setReloadPage] = useState<boolean>(false);

  const getLicenses = useGetLicenses();

  // When searchParams change or is triggered reload -> Reset page
  useEffect(() => {
    setPage(0);
    setLicenses([]);
    setIsLoading(true);
  }, [reloadPage]);

  useEffect(() => {
    if (page === 0) {
      setPage(1);
      return;
    }

    (async () => {
      const fp = searchParams.get('parent-id')?.split('&') ?? [];

      try {
        const { items, metadata } = await getLicenses({
          page,
          limit: 50,
        });

        // Set items and metadata
        setMaxPage(metadata.pages);
        setLicenses([...(licenses ?? []), ...items]);
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
    <ItemContainer
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      isError={isError}
      items={licenses}
      setItems={setLicenses}
      page={page}
      setPage={setPage}
      maxPage={maxPage}
      loadingNext={loadingNext}
      setLoadingNext={setLoadingNext}
      isEntries={false}
      searchSpecifier={'title'}
      showSearch={false}
    >
      <div className='flex flex-wrap px-3 pb-4'>
        {/* admin licenses */}
        {licenses.map((license, index) => (
          <AdminLicense
            key={index}
            license={license}
            setReloadPage={setReloadPage}
            reloadPage={reloadPage}
          />
        ))}
        {loadingNext && <LoadNext />}
      </div>
    </ItemContainer>
  );
};

export default AdminLicences;
