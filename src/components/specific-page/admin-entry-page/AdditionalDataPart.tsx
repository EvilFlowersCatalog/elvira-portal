import { useTranslation } from 'react-i18next';
import { getBase64, imageUrlToFile } from '../../../utils/func/functions';
import { IPartParams } from '../../../utils/interfaces/general/general';
import ImageDropzone from '../../dropzones/ImageDropzone';
import ElviraInput from '../../inputs/ElviraInput';
import LanguageAutofill from '../../autofills/LanguageAutofill';
import ElviraSelect from '../../inputs/ElviraSelect';
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
  const { stuText, umamiTrack } = useAppContext();

  const year = new Date().getFullYear();
  const [maxDay, setMaxDay] = useState<number>(31);
  const [image, setImage] = useState<File | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('YYYY');
  const [selectedMonth, setSelectedMonth] = useState<string>('MM');
  const [selectedDay, setSelectedDay] = useState<string>('DD');

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
  }, []);

  // set date values
  useEffect(() => {
    if (entry.published_at) {
      const [y, m, d] = entry.published_at.split('-');
      if (y) setSelectedYear(y);
      if (m) setSelectedMonth(parseInt(m).toString()); // remove the '0'2 to just 2...
      if (d) setSelectedDay(parseInt(d).toString()); // same
    }
  }, []);

  // when month change change possible day (30;31;28/29)
  useEffect(() => {
    if (selectedMonth !== 'MM') {
      if (['1', '3', '5', '7', '8', '10', '12'].includes(selectedMonth)) {
        setMaxDay(31);
      } else if (selectedMonth == '2') {
        // when its february
        if (selectedYear !== 'YYYY') {
          const numYear = parseInt(selectedYear);
          if (
            (numYear % 4 === 0 && numYear % 100 !== 0) ||
            numYear % 400 === 0
          ) {
            setMaxDay(29); // Leap year, February has 29 days
          } else {
            setMaxDay(28); // Non-leap year, February has 28 days
          }
        }
      } else setMaxDay(30);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (
      selectedYear !== 'YYYY' &&
      selectedMonth !== 'MM' &&
      selectedDay !== 'DD'
    ) {
      setEntry({
        ...entry,
        published_at: `${selectedYear}-${selectedMonth}-${selectedDay}`,
      });
    } else if (selectedYear !== 'YYYY' && selectedMonth !== 'MM') {
      setEntry({
        ...entry,
        published_at: `${selectedYear}-${selectedMonth}`,
      });
    } else if (selectedYear !== 'YYYY') {
      setEntry({
        ...entry,
        published_at: `${selectedYear}`,
      });
    } else {
      setEntry({
        ...entry,
        published_at: '',
      });
    }
  }, [selectedDay, selectedMonth, selectedYear]);

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.setCustomValidity(''); // reset invalidity
    setEntry({
      ...entry, // Preserve existing properties of entryForm
      title: event.target.value, // Update the title property
    });
  };

  const handlePublisherChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntry({
      ...entry, // Preserve existing properties of entryForm
      publisher: event.target.value, // Update the publisher property
    });
  };

  return (
    <div className='flex flex-col md:flex-row bg-zinc-100 dark:bg-darkGray gap-4 rounded-md p-4'>
      <div
        className={`relative w-48 m-auto ${
          stringImage ? 'h-fit' : 'h-72 md:h-full'
        } p-2`}
      >
        {stringImage && (
          <img className='w-full h-auto' src={stringImage} alt='image' />
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
          <LanguageAutofill entryForm={entry} setEntryForm={setEntry} setIsSelectionOpen={()=>{}} isRequired={true} />
          <ElviraInput
            onChange={handlePublisherChange}
            placeholder={t('entry.wizard.publisher')}
            value={entry.publisher ?? ''}
          />
          <div className='flex flex-col'>
            <span className={`${stuText} pl-1`}>{t('entry.wizard.year')}</span>
            <div className='w-fit flex gap-4'>
              <ElviraSelect
                name='date-year'
                value={selectedYear}
                onChange={(e) => {
                  umamiTrack('Year Selection', {
                    year: e.target.value,
                  });
                  setSelectedYear(e.target.value);
                }}
              >
                <option value='YYYY'>YYYY</option>
                {Array.from({
                  length: year - 1900,
                }).map((_, i) => (
                  <option key={i} value={(year - i).toString()}>
                    {year - i}
                  </option>
                ))}
              </ElviraSelect>
              {selectedYear !== 'YYYY' && (
                <ElviraSelect
                  name='date-month'
                  value={selectedMonth}
                  onChange={(e) => {
                    umamiTrack('Month Selection', {
                      month: e.target.value,
                    });
                    setSelectedMonth(e.target.value);
                  }}
                >
                  <option value='MM'>MM</option>
                  {Array.from({
                    length: 12,
                  }).map((_, i) => (
                    <option key={i} value={(i + 1).toString()}>
                      {i + 1}
                    </option>
                  ))}
                </ElviraSelect>
              )}
              {selectedMonth !== 'MM' && selectedYear !== 'YYYY' && (
                <ElviraSelect
                  name='date-day'
                  value={selectedDay}
                  onChange={(e) => {
                    umamiTrack('Day Selection', {
                      day: e.target.value,
                    });
                    setSelectedDay(e.target.value);
                  }}
                >
                  <option value='DD'>DD</option>
                  {Array.from({
                    length: maxDay,
                  }).map((_, i) => (
                    <option key={i} value={(i + 1).toString()}>
                      {i + 1}
                    </option>
                  ))}
                </ElviraSelect>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalDataPart;
