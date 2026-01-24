import { MouseEvent } from 'react';
import useAppContext from '../../hooks/contexts/useAppContext';
import { IEntryAcquisition } from '../../utils/interfaces/acquisition';
import Button from './Button';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

interface IPDFButtonsParams {
  acquisition: IEntryAcquisition;
  entryId: string;
  catalogId?: string;
  index: number;
  children: React.ReactNode;
}

const PDFButton = ({ acquisition, index, entryId, catalogId, children }: IPDFButtonsParams) => {
  const { umamiTrack } = useAppContext();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const handleRead = (e: MouseEvent<HTMLButtonElement>) => {
    umamiTrack('PDF Read Button', {
      pdf: acquisition.id,
      entryId,
    });
    const path = NAVIGATION_PATHS.viewer + entryId + `/${index}`;
    const from = location.pathname.includes(NAVIGATION_PATHS.shelf) ? 'shelf' : '';
    
    // Navigate with catalog_id in state
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    e.preventDefault();
    if (e.ctrlKey || (e.metaKey && isMac) || e.button === 1) {
      window.open(path, '_blank');
    } else {
      const state: { from?: string; catalogId?: string } = {};
      if (from) state.from = from;
      if (catalogId) state.catalogId = catalogId;
      navigate(path, { state });
    }
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
