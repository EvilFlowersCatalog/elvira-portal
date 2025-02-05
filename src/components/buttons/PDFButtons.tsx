import { MouseEvent } from 'react';
import useAppContext from '../../hooks/contexts/useAppContext';
import { IEntryAcquisition } from '../../utils/interfaces/acquisition';
import Button from './Button';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { ILicense } from '../../utils/interfaces/licenses';

interface IPDFButtonsParams {
  acquisitions: IEntryAcquisition[];
  entryId: string;
  readium: boolean;
  license: ILicense | null;
  showLicenseForm: (show: boolean) => void;
}

const PDFButtons = ({
  acquisitions,
  entryId,
  readium,
  license,
  showLicenseForm,
}: IPDFButtonsParams) => {
  const { specialNavigation, umamiTrack } = useAppContext();
  const { t } = useTranslation();
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

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = license!.url;
    link.download = 'document.pdf'; // Suggested filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className='flex gap-2 items-center'>
      {' '}
      {acquisitions?.map((acq, index) => (
        <div key={acq.id} className='text-white'>
          <Button
            className='py-0'
            onClick={
              readium
                ? license
                  ? () => handleDownload()
                  : () => showLicenseForm(true)
                : (e) => handleRead(e, index)
            }
            title={
              readium
                ? license
                  ? t('entry.detail.download')
                  : t('entry.detail.borrow')
                : t('entry.detail.read')
            }
          />
        </div>
      ))}
    </div>
  );
};

export default PDFButtons;
