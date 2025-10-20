import { useEffect, useState } from 'react';
import useAppContext from '../../../hooks/contexts/useAppContext';
import { ILicense } from '../../../utils/interfaces/licenses';
import useGetEntryDetail from '../../../hooks/api/entries/useGetEntryDetail';
import PageLoading from '../../page/PageLoading';
import { useTranslation } from 'react-i18next';
import LicenseForm from './LicenseForm';

interface ILicenseParams {
  license: ILicense;
  reloadPage: boolean;
  setReloadPage: (reloadPage: boolean) => void;
}

const AdminLicense = ({
  license,
  reloadPage,
  setReloadPage,
}: ILicenseParams) => {
  const { stuBg } = useAppContext();
  const { t } = useTranslation();

  const [title, setTitle] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getEntryDetail = useGetEntryDetail();

  useEffect(() => {
    setIsLoading(true);

    try {
      (async () => {
        const { response } = await getEntryDetail(license.entry_id);
        setTitle(response.title);
      })();
    } catch {
      setTitle('Unobtained');
    } finally {
      setIsLoading(false);
    }
  }, [license.entry_id]);

  return (
    <>
      <div className={'relative flex p-2 w-full md:w-1/2 xl:w-1/4'}>
        <div
          className={`p-5 gap-5 w-full h-full flex text-center justify-between items-center ${
            isLoading ? 'bg-white' : stuBg
          } text-white rounded-md`}
        >
          {isLoading ? (
            <PageLoading size={50} />
          ) : (
            <div
              className={'w-full flex flex-col text-center sm:text-left gap-2'}
            >
              <span className={'text-xl font-bold'}>{title}</span>
              <span className={'text-sm uppercase font-bold mb-5'}>
                {license.state}
              </span>
              <div className='w-full max-md:flex-col flex justify-between gap-2'>
                <span className={'text-md md:text-center'}>
                  {t('license.startsAt')} <br></br>
                  {license.starts_at.split('T')[0]}
                </span>
                <span className={'text-md md:text-center'}>
                  {t('license.expiresAt')} <br></br>
                  {license.expires_at.split('T')[0]}
                </span>
              </div>

              {/* Button */}
              <button
                onClick={() => setIsOpen(true)}
                className={`${stuBg} hover:bg-white text-white hover:text-black px-5 py-2 rounded-md cursor-pointer mt-3`}
              >
                {t('license.edit')}
              </button>
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <LicenseForm
          setOpen={setIsOpen}
          license={license}
          reloadPage={reloadPage}
          setReloadPage={setReloadPage}
        />
      )}
    </>
  );
};

export default AdminLicense;
