import { useTranslation } from 'react-i18next';
import CircleLoader from 'react-spinners/CircleLoader';
import { IEntry } from '../../utils/interfaces/entry';
import useAppContext from '../../hooks/contexts/useAppContext';

interface IShelfButtonParams {
  isLoading: boolean;
  shelfId?: string;
  entryId: string;
  handleAdd: () => void;
  handleRemove: () => void;
}

const ShelfButton = ({
  isLoading,
  handleAdd,
  handleRemove,
  shelfId,
  entryId,
}: IShelfButtonParams) => {
  const { umamiTrack } = useAppContext();
  const { t } = useTranslation();

  const onClickRemove = () => {
    umamiTrack('Remove from Shelf Button', {
      entryId,
    });
    handleRemove();
  };
  const onClickAdd = () => {
    umamiTrack('Add to Shelf Button', {
      entryId,
    });
    handleAdd();
  };

  return (
    <>
      {isLoading ? (
        <CircleLoader className={'my-2.5'} color={'#00abe1'} size={28} />
      ) : shelfId ? (
        <button
          className={
            'flex gap-2 items-center px-2 py-1 text-red mb-2 border border-darkGray border-opacity-0 hover:border-red rounded-md'
          }
          onClick={onClickRemove}
        >
          {t('entry.detail.remove')}
        </button>
      ) : (
        <button
          className={
            'flex gap-2 items-center px-2 py-1 text-green mb-2 border border-darkGray border-opacity-0 hover:border-green rounded-md'
          }
          onClick={onClickAdd}
        >
          {t('entry.detail.add')}
        </button>
      )}
    </>
  );
};

export default ShelfButton;
