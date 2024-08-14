import { FormEvent, useState } from 'react';
import ElviraInput from '../../../../components/common/ElviraInput';
import PageLoading from '../../../../components/page/PageLoading';
import NextButton from './NextButton';
import {
  IDENTIFIERS_TYPE,
  IWizardParams,
} from '../../../../utils/interfaces/general/general';
import { IEntryInfo, IEntryNewForm } from '../../../../utils/interfaces/entry';
import useGetData from '../../../../hooks/api/identifiers/useGetData';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import ApplyInfoDialog from '../../../../components/dialogs/ApplyInfoDialog';

const FirstStep = ({
  entryForm,
  setEntryForm,
  stepIndex,
  setStepIndex,
}: IWizardParams) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [identifier, setIdentifier] = useState<string>('');
  const [identifierType, setIdentifierType] = useState<IDENTIFIERS_TYPE | null>(
    null
  );
  const [entryInfo, setEntryInfo] = useState<IEntryInfo | null>(null);
  const [openApplyInfo, setOpenApplyInfo] = useState<boolean>(false);

  const getData = useGetData();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // if there is some identifier
      if (identifier) {
        // set loading
        setIsLoading(true);
        let identifierTypeHolder: IDENTIFIERS_TYPE | null = null;
        if (identifier.startsWith('10')) {
          identifierTypeHolder = IDENTIFIERS_TYPE.doi;
          setEntryForm({
            ...entryForm, // Preserve existing properties of entryForm
            identifiers: {
              ...entryForm.identifiers, // Preserve existing properties of identifiers
              doi: identifier, // Update the isbn property
            },
          });
        } else {
          identifierTypeHolder = IDENTIFIERS_TYPE.isbn;
          setEntryForm({
            ...entryForm, // Preserve existing properties of entryForm
            identifiers: {
              ...entryForm.identifiers, // Preserve existing properties of identifiers
              isbn: identifier, // Update the isbn property
            },
          });
        }

        // get info from endpoint
        const givenEntryInfo = await getData(identifierTypeHolder, identifier);

        setIdentifierType(identifierTypeHolder);
        // If succes save
        setEntryInfo(givenEntryInfo);

        // Notify and open apply info dialog
        toast.success(t('notifications.dataFromIdentifiers.success'));
        setOpenApplyInfo(true);
      }
    } catch {
      setOpenApplyInfo(false);
      // Notify about error
      toast.error(t('notifications.dataFromIdentifiers.error'));
    } finally {
      // Whatever happens go to next step and set loading to false
      setIsLoading(false);
      setStepIndex(stepIndex + 1);
    }
  };

  const handleApplyInfo = () => {
    setEntryForm({
      ...entryForm,
      title: entryInfo?.response.title ?? '',
      authors: entryInfo?.response.authors ?? [],
      publisher: entryInfo?.response.publisher ?? '',
      published_at: entryInfo?.response.published_at ?? '',
      language_code: entryInfo?.response.language ?? '',
      citation: entryInfo?.response.bibtex ?? '',
    });

    setOpenApplyInfo(false);
  };

  return (
    <>
      <form
        className='w-full h-fit flex flex-col justify-start items-center gap-4'
        onSubmit={handleSubmit}
      >
        {isLoading ? (
          <div className='w-full h-96 flex'>
            <PageLoading />
          </div>
        ) : (
          <>
            <span className='text-3xl font-extrabold '>
              {t('entry.wizard.identifiers')}
            </span>
            <ElviraInput
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder='DOI / ISBN'
              value={identifier}
            />
            <div className='w-full flex justify-end pt-7'>
              <NextButton />
            </div>
          </>
        )}
      </form>
      {openApplyInfo && identifierType && (
        <ApplyInfoDialog
          type={identifierType}
          identifier={identifier}
          close={setOpenApplyInfo}
          yes={handleApplyInfo}
        />
      )}
    </>
  );
};

export default FirstStep;
