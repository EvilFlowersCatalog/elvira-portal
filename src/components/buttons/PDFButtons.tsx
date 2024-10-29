import { MouseEvent } from 'react';
import useAppContext from '../../hooks/contexts/useAppContext';
import { IEntryAcquisition } from '../../utils/interfaces/acquisition';
import Button from './Button';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

interface IPDFButtonsParams {
  acquisitions: IEntryAcquisition[];
  entryId: string;
}

const PDFButtons = ({ acquisitions, entryId }: IPDFButtonsParams) => {
  const { specialNavigation, umamiTrack } = useAppContext();
  const location = useLocation();

  const handleRead = (e: MouseEvent<HTMLButtonElement>, index: number) => {
    umamiTrack('PDF Read Button', {
      pdf: acquisitions[index].id,
      entryId,
    });
    specialNavigation(
      e,
      NAVIGATION_PATHS.viewer + entryId + `/${index}`,
      location.pathname.includes(NAVIGATION_PATHS.shelf) ? 'shelf' : ''
    );
  };

  return acquisitions?.map((_, index) => (
    <div key={index} className='flex gap-4 items-center text-white'>
      <Button
        className='py-0'
        onClick={(e) => handleRead(e, index)}
        title={
          acquisitions[index].mime.includes('pdf')
            ? 'PDF'
            : acquisitions[index].mime
        }
      />
    </div>
  ));
};

export default PDFButtons;
