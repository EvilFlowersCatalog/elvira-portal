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
            'flex gap-2 items-center px-4 py-2 text-white font-semibold mb-2 border-2 border-red rounded-md hover:bg-red hover:bg-opacity-50 duration-200'
          }
          onClick={onClickRemove}
        >
          {t('entry.detail.remove')}
        </button>
      ) : (
        <button
          className={
            'flex gap-2 items-center px-4 py-2 text-white font-semibold mb-2 border-2 border-green rounded-md hover:bg-green hover:bg-opacity-50 duration-200'
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
