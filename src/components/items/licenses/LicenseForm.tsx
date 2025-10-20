import { FormEvent, useRef, useState } from 'react';
import ModalWrapper from '../../modal/ModalWrapper';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-datepicker';
import useAppContext from '../../../hooks/contexts/useAppContext';
import useUploadLicense from '../../../hooks/api/licenses/useUploadLicense';
import { toast } from 'react-toastify';
import { ILicense, LICENSE_STATE } from '../../../utils/interfaces/licenses';
import useEditLicense from '../../../hooks/api/licenses/useEditLicense';
import { Duration } from 'luxon';

interface ILicenseForm {
  setOpen: (open: boolean) => void;
  license?: ILicense | null;
  entryId?: string;
  reloadPage?: boolean;
  setReloadPage?: (reloadPage: boolean) => void;
}

const licenseForm = ({
  setOpen,
  license = null,
  entryId,
  reloadPage,
  setReloadPage,
}: ILicenseForm) => {
  const { t } = useTranslation();
  const { stuBorder } = useAppContext();
  const [state, setState] = useState<LICENSE_STATE>(
    license?.state ?? LICENSE_STATE.active
  );

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const createLicense = useUploadLicense();
  const editLicense = useEditLicense();

  // State for start and end date
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [period, setPeriod] = useState<number>(7);
  const [select] = useState<{ name: string; value: number }[]>([
    { name: '7d', value: 7 },
    { name: '14d', value: 14 },
    { name: '30d', value: 30 },
  ]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const duration = Duration.fromObject({ days: period });

    const isoDuration = duration.toISO();

    if (entryId) {
      try {
        await createLicense({
          entry_id: entryId,
          state: LICENSE_STATE.active,
          duration: isoDuration,
          starts_at: startDate!.toISOString(),
        });

        toast.success(t('notifications.license.add.success'));
        setOpen(false);
      } catch {
        toast.error(t('notifications.license.add.error'));
        setStartDate(null);
        setPeriod(7);
      }
    } else if (license) {
      try {
        await editLicense(license.id, {
          state,
          duration: isoDuration,
        });

        // Exist when editing
        setReloadPage!(!reloadPage!);

        toast.success(t('notifications.license.edit.success'));
        setOpen(false);
      } catch {
        toast.error(t('notifications.license.edit.error'));
        setStartDate(null);
        setPeriod(7);
      }
    }
  };

  return (
    <ModalWrapper
      title={
        license
          ? t('modal.licenseForm.title.edit')
          : t('modal.licenseForm.title.add')
      }
      close={setOpen}
      buttonLabel={
        license
          ? t('modal.licenseForm.button.edit')
          : t('modal.licenseForm.button.add')
      }
      yes={() => {
        buttonRef.current?.click();
      }}
    >
      <form onSubmit={handleSubmit} className='mb-10 flex flex-col gap-5'>
        {license ? (
          <div className='flex flex-col gap-2'>
            <span className='text-lg font-bold'>State</span>
            <select
              value={state}
              onChange={(e: any) => setState(e.target.value)}
              className='rounded-md bg-transparent outline-none'
            >
              {Object.values(LICENSE_STATE).map((state) => (
                <option key={state} value={state}>
                  {state.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        ) : (
          // Start Date Picker
          <DatePicker
            className={`bg-transparent w-full text-black dark:text-white cursor-pointer text-center border-2 py-2 rounded-md ${stuBorder}`}
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            minDate={new Date()}
            dateFormat='yyyy-MM-dd'
            placeholderText={t('modal.licenseForm.startDate')}
            required
          />
        )}
        <div className='flex flex-col gap-2'>
          <span className='text-lg font-bold'>Duration</span>
          <div className='flex max-md:flex-col gap-10 justify-center'>
            {select.map((item) => (
              <div
                key={item.name}
                className='flex md:flex-col gap-2 justify-center cursor-pointer'
                onClick={() => setPeriod(item.value)}
              >
                <input
                  className='cursor-pointer'
                  name='select-period-lenght'
                  type='radio'
                  onChange={() => {}}
                  checked={item.value === period}
                />
                <label className='cursor-pointer'>{item.name}</label>
              </div>
            ))}
          </div>
        </div>
        <button ref={buttonRef} type='submit' className='hidden'></button>
      </form>
    </ModalWrapper>
  );
};

export default licenseForm;
