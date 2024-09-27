import { MouseEvent } from 'react';
import useAppContext from '../../hooks/contexts/useAppContext';
import { IEntryAcquisition } from '../../utils/interfaces/acquisition';
import Button from './Button';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { useTranslation } from 'react-i18next';

interface IPDFButtonsParams {
  acquisitions: IEntryAcquisition[];
  entryId: string;
}

const PDFButtons = ({ acquisitions, entryId }: IPDFButtonsParams) => {
  const { specialNavigation } = useAppContext();
  const { t } = useTranslation();

  const handleRead = (e: MouseEvent<HTMLButtonElement>, index: number) => {
    umami.track('PDF Read Button', {
      pdf: acquisitions[index].id,
      entryId,
    });
    specialNavigation(e, NAVIGATION_PATHS.viewer + entryId + `/${index}`);
  };

  return acquisitions?.map((_, index) => (
    <div key={index} className='flex gap-4 items-center text-white'>
      <span className='text-[14px]'>PDF {index + 1}</span>
      <Button
        className='py-0'
        onClick={(e) => handleRead(e, index)}
        title={t('entry.detail.read')}
      />
    </div>
  ));
};

export default PDFButtons;
