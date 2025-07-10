import { IoMdDownload } from 'react-icons/io';
import {
  IDENTIFIERS_TYPE,
  IPartParams,
} from '../../../utils/interfaces/general/general';
import useAppContext from '../../../hooks/contexts/useAppContext';
import CircleLoader from 'react-spinners/CircleLoader';
import ElviraInput from '../../inputs/ElviraInput';
import { ChangeEvent, useState } from 'react';
import useGetData from '../../../hooks/api/identifiers/useGetData';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const IdentifiersPart = ({ entry, setEntry }: IPartParams) => {
  const { stuColor, umamiTrack } = useAppContext();
  const { t } = useTranslation();

  const [loadingInfo, setLoadingInfo] = useState<boolean>(false);

  const getData = useGetData();

  const handleIdentifier = async (
    driver: IDENTIFIERS_TYPE,
    identifier: string
  ) => {
    try {
      setLoadingInfo(true);
      const info = await getData(driver, identifier);

      setEntry({
        ...entry!,
        title: info?.title ?? entry?.title ?? '',
        authors: info?.authors ?? entry?.authors ?? [],
        publisher: info?.publisher ?? entry?.publisher ?? '',
        published_at: info?.year ?? entry?.published_at ?? '',
        language_code: info?.language ?? entry?.language_code,
        citation: info?.bibtex ?? entry?.citation,
      });

      toast.success(t('notifications.dataFromIdentifiers.success'));
    } catch {
      toast.error(t('notifications.dataFromIdentifiers.error'));
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleDOIChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntry({
      ...entry,
      identifiers: { ...entry?.identifiers!, doi: event.target.value }, // Update the doi property
    });
  };
  const handleISBNChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntry({
      ...entry, // Preserve existing properties of entryForm
      identifiers: { ...entry?.identifiers!, isbn: event.target.value }, // Update the isbn property
    });
  };

  return (
    <div className='flex flex-1 flex-col gap-2'>
      <span>{t('entry.wizard.identifiers')}</span>
      {loadingInfo ? (
        <div className={'flex h-full justify-center items-center'}>
          <CircleLoader color={stuColor} size={30} />
        </div>
      ) : (
        <div className='flex flex-col gap-4'>
          <div className='w-full flex gap-2 relative items-center'>
            <ElviraInput
              onChange={handleDOIChange}
              placeholder={'DOI'}
              value={entry.identifiers?.doi ?? ''}
            />
            <IoMdDownload
              className='absolute right-2 top-8 z-10 cursor-pointer'
              size={20}
              onClick={() => {
                if (entry.identifiers.doi) {
                  umamiTrack('DOI Identifier Download Button', {
                    identifier: entry.identifiers.doi,
                  });
                  handleIdentifier(IDENTIFIERS_TYPE.doi, entry.identifiers.doi);
                }
              }}
              color={stuColor}
            />
          </div>
          <div className='w-full flex gap-2 relative items-center'>
            <ElviraInput
              onChange={handleISBNChange}
              placeholder={'ISBN'}
              value={entry.identifiers?.isbn ?? ''}
            />
            <IoMdDownload
              className='absolute right-2 top-8 z-10 cursor-pointer'
              size={20}
              onClick={() => {
                if (entry.identifiers.isbn) {
                  umamiTrack('ISBN Identifier Download Button', {
                    identifier: entry.identifiers.isbn,
                  });
                  handleIdentifier(
                    IDENTIFIERS_TYPE.isbn,
                    entry.identifiers.isbn
                  );
                }
              }}
              color={stuColor}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default IdentifiersPart;
