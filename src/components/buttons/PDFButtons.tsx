import { MouseEvent } from 'react';
import useAppContext from '../../hooks/contexts/useAppContext';
import { IEntryAcquisition } from '../../utils/interfaces/acquisition';
import Button from './Button';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

interface IPDFButtonsParams {
  acquisition: IEntryAcquisition;
  entryId: string;
  index: number;
  children: React.ReactNode;
}

const PDFButton = ({ acquisition, index, entryId, children }: IPDFButtonsParams) => {
  const { specialNavigation, umamiTrack } = useAppContext();
  const { t } = useTranslation();
  const location = useLocation();

  const handleRead = (e: MouseEvent<HTMLButtonElement>) => {
    umamiTrack('PDF Read Button', {
      pdf: acquisition.id,
      entryId,
    });
    specialNavigation(
      e,
      NAVIGATION_PATHS.viewer + entryId + `/${index}`,
      location.pathname.includes(NAVIGATION_PATHS.shelf) ? 'shelf' : ''
    );
  };

  return (
    <button onClick={(e)=>{
      handleRead(e)
    }}>
      {children}
    </button>
  );
};

export default PDFButton;
