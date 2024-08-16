import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageLoading from '../../../../../components/page/PageLoading';
import useUploadEntry from '../../../../../hooks/api/entries/useUploadEntry';
import useDeleteEntry from '../../../../../hooks/api/entries/useDeleteEntry';
import { useNavigate } from 'react-router-dom';
import useCreateEntryAcquistion from '../../../../../hooks/api/acquisitiions/useCreateEntryAcquistion';
import { IEntryNew } from '../../../../../utils/interfaces/entry';
import { getBase64 } from '../../../../../utils/func/functions';
import { toast } from 'react-toastify';
import {
  IWizardParams,
  NAVIGATION_PATHS,
} from '../../../../../utils/interfaces/general/general';
import PreviousButton from '../PreviousButton';
import NextButton from '../NextButton';
import Dropzone from '../../../../../components/common/Dropzone';

const FifthStep = ({ entryForm, stepIndex, setStepIndex }: IWizardParams) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [image, setImage] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);

  const uploadEntry = useUploadEntry();
  const deleteEntry = useDeleteEntry();
  const navigate = useNavigate();
  const createEntryAcquisition = useCreateEntryAcquistion();

  const handleSubmitStepFive = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const entry: IEntryNew = {
      title: entryForm.title,
      authors: entryForm.authors,
      feeds: entryForm.feeds.map((feed) => {
        return feed.id;
      }),
      summary: entryForm.summary,
      language_code: entryForm.language_code,
      identifiers: {
        doi: entryForm.identifiers?.doi ?? '',
        isbn: entryForm.identifiers?.isbn ?? '',
      },
      citation: entryForm.citation ?? '',
      publisher: entryForm.publisher,
      image: await getBase64(image),
    };
    if (entryForm.published_at) entry.published_at = entryForm.published_at;

    if (!entry.image) {
      // If there is no image notify that it is needed
      toast.warning(t('entry.wizard.requiredMessages.image'));
    } else if (!pdf) {
      // If there is no pdf notify that it is needed
      toast.warning(t('entry.wizard.requiredMessages.pdf'));
    } else {
      setIsLoading(true);
      // Upload
      try {
        // upload entry and get it's info
        const { response: res } = await uploadEntry(entry);

        // create entry acquisition
        const entryAcquisition = new FormData();
        const metadata = {
          relation: 'open-access',
        };
        // Append needed variables
        entryAcquisition.append('content', pdf);
        entryAcquisition.append('metadata', JSON.stringify(metadata));

        try {
          // try to create acquistiion
          await createEntryAcquisition(entryAcquisition, res.id);
          toast.success(t('notifications.entry.add.success'));
        } catch {
          // if fails remove created entry
          await deleteEntry(res.id);
          toast.error(t('notifications.entry.add.error'));
        }
      } catch {
        toast.error(t('notifications.entry.add.error'));
      } finally {
        navigate(NAVIGATION_PATHS.adminEntries, { replace: true });
        setIsLoading(false);
      }
    }
  };

  const handleSetImage = (file: File | null) => {
    setImage(file);
  };

  const handleSetPDF = (file: File | null) => {
    setPdf(file);
  };

  return (
    <form
      className='w-full h-full flex flex-col justify-start items-center gap-4'
      onSubmit={handleSubmitStepFive}
    >
      {isLoading ? (
        <div className='w-full h-96 flex'>
          <PageLoading />
        </div>
      ) : (
        <>
          <span className='text-3xl font-extrabold '>
            {t('entry.wizard.imageAndFile')}
          </span>
          <div className='w-full h-full flex flex-col bg-lightGray dark:bg-darkGray rounded-md p-4 gap-4'>
            {/* IMAGE */}
            <Dropzone
              title={t('entry.wizard.image')}
              maxSizeDescription='(MAX 5 MB)'
              value={image}
              maxSize={1024 * 1024 * 5}
              setFile={handleSetImage}
              errorMessage={t('dropzone.errorMessage.image')}
              hint={t('entry.wizard.imageHint')}
            />
            {/* PDF */}
            <Dropzone
              pdf
              title='pdf'
              setFile={handleSetPDF}
              errorMessage={t('dropzone.errorMessage.pdf')}
              hint={t('entry.wizard.pdfHint')}
            />
          </div>
          <div className='w-full flex justify-end gap-4 pt-7'>
            <PreviousButton stepIndex={stepIndex} setStepIndex={setStepIndex} />
            <NextButton end />
          </div>
        </>
      )}
    </form>
  );
};

export default FifthStep;
