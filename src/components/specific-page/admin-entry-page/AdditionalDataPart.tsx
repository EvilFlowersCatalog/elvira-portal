import { useTranslation } from 'react-i18next';
import { getBase64, imageUrlToFile } from '../../../utils/func/functions';
import { IPartParams } from '../../../utils/interfaces/general/general';
import ImageDropzone from '../../dropzones/ImageDropzone';
import ElviraInput from '../../inputs/ElviraInput';
import LanguageAutofill from '../../autofills/LanguageAutofill';
import { ChangeEvent, useEffect, useState } from 'react';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import useAppContext from '../../../hooks/contexts/useAppContext';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

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
  const { stuText, umamiTrack } = useAppContext();

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

  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-[auto,1fr] bg-slate-200 dark:bg-gray gap-4 rounded-md p-4'>
      <div className={`relative w-48 m-auto h-full p-2`}>
        {stringImage && (
          <img className='w-full h-full object-cover' src={stringImage} alt='image' />
        )}
        {/* Image */}
        <div className='absolute top-0 left-0 w-full h-full bg-white dark:bg-black bg-opacity-30 dark:bg-opacity-30'>
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

      {/* Information */}
      <div className='flex flex-col flex-2'>
        <div className='flex flex-col gap-4'>
          <ElviraInput
            onChange={handleTitleChange}
            placeholder={t('entry.wizard.title')}
            invalidMessage={t('entry.wizard.requiredMessages.title')}
            value={entry.title ?? ''}
            required
          />
          <LanguageAutofill languageCode={languageCode} setLanguageCode={setLanguageCode} setIsSelectionOpen={() => { }} isRequired={true} />
          <ElviraInput
            onChange={handlePublisherChange}
            placeholder={t('entry.wizard.publisher')}
            value={entry.publisher ?? ''}
          />
          <div className='flex flex-col'>
            <div className='w-fit flex gap-4 mt-4'>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker 
                  label={t('entry.wizard.year')}
                  sx= {{
                    ".MuiInputLabel-formControl": {
                      color: 'black',
                    },
                    ".dark & .MuiInputLabel-formControl": {
                      color: 'white',
                    },
                    ".dark & .MuiButtonBase-root": {
                      color: 'white'
                    },
                     ".dark & :hover .MuiPickersOutlinedInput-notchedOutline" : {
                      borderColor: 'gray'
                    },
                    ".dark & .MuiPickersOutlinedInput-notchedOutline" : {
                      borderColor: 'white'
                    },
                    ".dark & .MuiPickersSectionList-root" : {
                      color: 'white'
                    }
                  }}
                  value={entry.published_at ? new Date(entry.published_at) : new Date()}
                  onChange={(date: Date | null) => {
                    if (date) {
                      const formatted = formatDate(date);
                      setEntry({
                        ...entry,
                        published_at: formatted,
                      });
                      umamiTrack('Date Selection', {
                        year: date.getFullYear().toString(),
                        month: (date.getMonth() + 1).toString(),
                        day: date.getDate().toString(),
                      });
                    } else {
                      setEntry({
                        ...entry,
                        published_at: '',
                      });
                    }
                  }}
                  views={['year', 'month', 'day']}
                />
              </LocalizationProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalDataPart;
