import Entry from './Entry';
import { useSearchParams } from 'react-router-dom';
import { IEntry } from '../../../utils/interfaces/entry';
import { useEffect, useState } from 'react';
import EntryInfo from './EntryInfo';
import PageLoading from '../PageLoading';
import PageEmpty from '../PageEmpty';
import useDataPage from '../../../hooks/useDataContext';

const EntryContainer = () => {
  const { data, isLoading } = useDataPage();
  const [searchParams] = useSearchParams();
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  // Check search params if there is entry-detail-id
  useEffect(() => {
    const entryDetailId = searchParams.get('entry-detail-id');
    if (entryDetailId) setActiveEntryId(entryDetailId);
    else setActiveEntryId(null);
  }, [searchParams]);

  return (
    <>
      {/* ENTRY INFO */}
      <EntryInfo entryId={activeEntryId} />

      {/* Content */}
      <div className='flex flex-col flex-1'>
        {data!.length === 0 && isLoading ? (
          <PageLoading />
        ) : data!.length > 0 ? (
          // ENTRIES
          <div className={`flex flex-wrap p-5`}>
            {data!.map((entry, index) => (
              <Entry
                key={index}
                entry={entry as IEntry}
                isActive={activeEntryId === entry.id}
              />
            ))}
          </div>
        ) : (
          <PageEmpty />
        )}
      </div>
    </>
  );
};

export default EntryContainer;
