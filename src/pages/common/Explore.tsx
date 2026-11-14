import { useTranslation } from 'react-i18next';
import { CircleLoader } from 'react-spinners';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import { H1 } from '../../components/primitives/Heading';
import EntryDetail from '../../components/items/entry/details/EntryDetail';
import LibraryMap from '../../components/graph/LibraryMap';
import { useLibraryMap } from '../../hooks/api/graph/useGraph';
import useOpenPublication from '../../hooks/useOpenPublication';

/** "Explore": the library as a map of related publications (elvira-portal#41, feature 1). */
const Explore = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useLibraryMap();
  const { openDetail } = useOpenPublication();

  return (
    <>
      <Breadcrumb />
      <H1>{t('explore.title')}</H1>
      <div className="px-5 pb-10">
        <p className="mb-5 max-w-3xl text-gray-600 dark:text-gray-400">{t('explore.description')}</p>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <CircleLoader size={40} color="#0077cc" />
          </div>
        ) : isError ? (
          <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">{t('explore.error')}</p>
        ) : !data?.nodes.length ? (
          // An empty map means the graph is off or not filled yet: say so quietly, no error state.
          <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">{t('explore.empty')}</p>
        ) : (
          <LibraryMap map={data} onOpen={openDetail} />
        )}
      </div>
      <EntryDetail />
    </>
  );
};

export default Explore;
