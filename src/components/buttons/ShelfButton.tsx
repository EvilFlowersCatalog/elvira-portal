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
  children: React.ReactNode;
}

const ShelfButton = ({
  isLoading,
  handleAdd,
  handleRemove,
  shelfId,
  entryId,
  children,
}: IShelfButtonParams) => {
  const { umamiTrack } = useAppContext();

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
      {shelfId ? (
        <div onClick={onClickRemove}>
          {children}
        </div>
      ) : (
        <div onClick={onClickAdd}>
          {children}
        </div>
      )}
    </>
  );
};

export default ShelfButton;
