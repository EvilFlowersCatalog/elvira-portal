import { useEffect, useState } from 'react';
import useGetEntryDetail from '../../hooks/api/entries/useGetEntryDetail';
import { useParams } from 'react-router-dom';
import EntryWizard from '../../components/data-page/entry/admin/EntryWizard';
import { IEntryDetail } from '../../utils/interfaces/entry';
import PageLoading from '../../components/data-page/PageLoading';

const EntryManipulation = ({ edit = false }) => {
  const [render, setRender] = useState<boolean>(false);
  const getEntryDetail = useGetEntryDetail();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [entry, setEntry] = useState<IEntryDetail | undefined>(undefined);

  useEffect(() => {
    // Skip initial render
    if (!render) {
      setRender(true);
      return;
    }

    const getDetial = async () => {
      const entryDetail = await getEntryDetail(id!);
      setEntry(entryDetail);
      setIsLoading(false);
    };

    if (id && edit) {
      setIsLoading(true);
      getDetial();
    }
  }, [render]);

  return !isLoading ? (
    <EntryWizard form={entry} edit={edit} />
  ) : (
    <PageLoading />
  );
};

export default EntryManipulation;
