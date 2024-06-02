import { useParams } from 'react-router-dom';
import Breadcrumb from '../../../components/common/Breadcrumb';
import useCustomEffect from '../../../hooks/useCustomEffect';
import useGetEntryDetail from '../../../hooks/api/entries/useGetEntryDetail';
import { useState } from 'react';
import { IEntryNew } from '../../../utils/interfaces/entry';
import PageLoading from '../../../components/page/PageLoading';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../../hooks/contexts/useAppContext';

const AdminEditEntry = () => {
  const { t } = useTranslation();
  const { setEditingEntryTitle } = useAppContext();
  const { 'entry-id': id } = useParams();
  const [entry, setEntry] = useState<IEntryNew | null>(null);

  const getEntryDetail = useGetEntryDetail();

  useCustomEffect(() => {
    try {
      (async () => {
        if (id) {
          const { response: entryDetail } = await getEntryDetail(id);
          setEditingEntryTitle(entryDetail.title);

          setEntry({
            title: entryDetail.title,
            authors: entryDetail.authors,
            feeds: entryDetail.feeds.map((feed) => feed.id),
            summary: entryDetail.summary,
            language_code: entryDetail.language?.code ?? '',
            identifiers: entryDetail.identifiers,
            citation: entryDetail.citation,
            published_at: entryDetail.published_at,
            publisher: entryDetail.publisher,
            image: entryDetail.thumbnail,
          });
        }
      })();
    } catch {
      setEntry(null);
    }
  }, [id]);

  return (
    <div className='flex flex-col flex-1'>
      <Breadcrumb />
      {!entry ? (
        <PageLoading />
      ) : (
        <form className='flex flex-col md:flex-row flex-1 p-4 pt-0'>
          <div className='flex flex-col flex-1 min-h-96'>
            <span>title</span>
            <span>author</span>
            <span>Co-Authors</span>
            <span>feeds</span>
            <span>image</span>
          </div>
          <div className='flex flex-1 flex-col'>
            <div className='min-h-56 flex-1'>summary</div>
            <div className='min-h-96 flex-2'>citation</div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminEditEntry;
