import { useTranslation } from 'react-i18next';
import { getBase64, imageUrlToFile } from '../../../utils/func/functions';
import { IPartParams } from '../../../utils/interfaces/general/general';
import ImageDropzone from '../../dropzones/ImageDropzone';
import ElviraInput from '../../inputs/ElviraInput';
import LanguageAutofill from '../../autofills/LanguageAutofill';
import { ChangeEvent, useEffect, useState } from 'react';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import useAppContext from '../../../hooks/contexts/useAppContext';

interface IAdditionalDataPartParams extends IPartParams {
  stringImage: string;
  setStringImage: (stringImage: string) => void;
}

const AdditionalDataPart = ({
  entry,
  setEntry,
  stringImage,
  setStringImage,
}: IAdditionalDataPartParams) => {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const { umamiTrack } = useAppContext();

  const [image, setImage] = useState<File | null>(null);
  const [languageCode, setLanguageCode] = useState<string>(entry.language_code || '');

  useEffect(() => {
    setEntry({
      ...entry,
      language_code: languageCode,
    });
  }, [languageCode]);

  // set image
  useEffect(() => {
    (async () => {
      if (entry.thumbnail) {
        try {
          const image = await imageUrlToFile(
            entry.thumbnail + `?access_token=${auth?.token}`,
            'Image'
          );
          setImage(image);

          const base64image = await getBase64(image);
          setStringImage(base64image as string);
        } catch {
          setImage(null);
        }
      }
    })();
    // eslint-disable-next-line
  }, []);

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.setCustomValidity('');
    setEntry({
      ...entry,
      title: event.target.value,
    });
  };

  const handlePublisherChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntry({
      ...entry,
      publisher: event.target.value,
    });
  };

  return (
    <div className='flex flex-col gap-4'>
      {/* Cover */}
      <div className='relative mx-auto aspect-[3/4] w-40 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700'>
        {stringImage && (
          <img className='h-full w-full object-cover' src={stringImage} alt='' />
        )}
        <div className='absolute inset-0 bg-white/30 dark:bg-black/30'>
          <ImageDropzone
            title={t('entry.wizard.image')}
            maxSizeDescription='(MAX 5 MB)'
            maxSize={1024 * 1024 * 5}
            setFile={async (file) => {
              if (file) {
                const sf = await getBase64(file);
                setStringImage(sf as string);
              } else setStringImage('');
            }}
            value={image}
            errorMessage={t('dropzone.errorMessage.image')}
            hint={t('entry.wizard.imageHint')}
          />
        </div>
      </div>

      {/* Publish details */}
      <div className='flex flex-col gap-4'>
        <LanguageAutofill languageCode={languageCode} setLanguageCode={setLanguageCode} setIsSelectionOpen={() => { }} isRequired={true} />
        <ElviraInput
          onChange={handlePublisherChange}
          placeholder={t('entry.wizard.publisher')}
          value={entry.publisher ?? ''}
        />
        <div className='flex flex-col'>
          <div className='w-full flex flex-col gap-1'>
            <label htmlFor='published-at' className='text-sm pl-1 text-black dark:text-white'>
              {t('entry.wizard.year')}
            </label>
            <input
              id='published-at'
              type='date'
              className='w-full p-2 bg-white shadow-[0px_4px_12px_0px_#0000001A] dark:shadow-[0px_4px_12px_0px_#9999991A] dark:bg-strongDarkGray dark:text-white outline-none rounded-md border border-black dark:border-white focus:border-primary [color-scheme:light] dark:[color-scheme:dark]'
              value={entry.published_at ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  const [year, month, day] = value.split('-');
                  setEntry({
                    ...entry,
                    published_at: value,
                  });
                  umamiTrack('Date Selection', {
                    year: parseInt(year, 10).toString(),
                    month: parseInt(month, 10).toString(),
                    day: parseInt(day, 10).toString(),
                  });
                } else {
                  setEntry({
                    ...entry,
                    published_at: '',
                  });
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalDataPart;
