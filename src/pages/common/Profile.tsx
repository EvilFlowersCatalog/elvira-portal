import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import Button from '../../components/buttons/Button';
import ElviraInput from '../../components/inputs/ElviraInput';
import PageLoading from '../../components/page/PageLoading';
import PageMessage from '../../components/page/PageMessage';
import { H1 } from '../../components/primitives/Heading';
import useGetUserDetails from '../../hooks/api/users/useGetUserDetails';
import useSetUserPassphrase from '../../hooks/api/users/useSetUserPassphrase';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import { IUser } from '../../utils/interfaces/user';

const Profile = () => {
  const { t } = useTranslation();
  const { auth } = useAuthContext();

  const getUserDetails = useGetUserDetails();
  const setUserPassphrase = useSetUserPassphrase();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState<IUser | null>(null);
  const [passphrase, setPassphrase] = useState<string>('');

  useEffect(() => {
    if (!auth) {
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const details = await getUserDetails(auth.userId);

        if (mounted) {
          setUserDetails(details);
        }
      } catch {
        if (mounted) {
          setIsError(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [auth?.userId]);

  const userEmail = useMemo(() => {
    if (userDetails?.username) {
      return `${userDetails.username}@stuba.sk`;
    }

    if (auth?.username) {
      return `${auth.username}@stuba.sk`;
    }

    return '-';
  }, [auth?.username, userDetails?.username]);

  if (!auth) {
    return null;
  }

  const formatDate = (value: string | undefined) => {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleString();
  };

  const handleSetPassphrase = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      await setUserPassphrase({
        userId: auth.userId,
        passphrase,
      });

      toast.success(t('profile.passphrase.success'));
      setPassphrase('');
    } catch {
      toast.error(t('profile.passphrase.notImplemented'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='w-full h-full overflow-auto pb-10'>
      <Breadcrumb />
      <H1>{t('profile.title')}</H1>

      {isLoading && <PageLoading />}
      {!isLoading && isError && <PageMessage message={t('page.error')} />}

      {!isLoading && !isError && (
        <div className='px-4 flex flex-col gap-5'>
          <section className='rounded-xl p-5 bg-white dark:bg-zinc-800 shadow-[0px_4px_12px_0px_#0000001A] dark:shadow-[0px_4px_12px_0px_#9999991A]'>
            <div className='flex flex-wrap gap-4 items-center'>
              <div className='w-16 h-16 rounded-full bg-primaryLight dark:bg-zinc-700 text-primary dark:text-secondaryLight text-2xl font-bold flex items-center justify-center'>
                {(auth.name?.[0] || auth.username?.[0] || 'U').toUpperCase()}
              </div>
              <div className='min-w-[220px]'>
                <p className='text-lg font-bold text-secondary dark:text-secondaryLight'>
                  {auth.name} {auth.surname}
                </p>
                <p className='text-sm text-zinc-600 dark:text-zinc-300'>{userEmail}</p>
              </div>
              <div className='ml-auto px-3 py-1 rounded-full text-xs font-medium bg-primaryLight text-primary dark:bg-zinc-700 dark:text-secondaryLight'>
                {auth.isSuperUser
                  ? t('navbarMenu.superUser')
                  : t('navbarMenu.user')}
              </div>
            </div>

            <div className='mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-700'>
              <h2 className='text-base font-semibold text-secondary dark:text-secondaryLight mb-3'>
                {t('profile.activity.title')}
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <div className='rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/30 px-4 py-3'>
                  <p className='text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
                    {t('profile.fields.firstLogin')}
                  </p>
                  <p className='text-sm font-medium text-zinc-800 dark:text-zinc-200 mt-1'>
                    {formatDate(userDetails?.created_at)}
                  </p>
                </div>

                <div className='rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/30 px-4 py-3'>
                  <p className='text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
                    {t('profile.fields.lastLogin')}
                  </p>
                  <p className='text-sm font-medium text-zinc-800 dark:text-zinc-200 mt-1'>
                    {formatDate(userDetails?.last_login)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className='rounded-xl p-5 bg-white dark:bg-zinc-800 shadow-[0px_4px_12px_0px_#0000001A] dark:shadow-[0px_4px_12px_0px_#9999991A]'>
            <h2 className='text-xl font-bold text-secondary dark:text-secondaryLight'>
              {t('profile.passphrase.title')}
            </h2>
            <p className='text-sm text-zinc-600 dark:text-zinc-300 mt-1 mb-4'>
              {t('profile.passphrase.description')}
            </p>

            <form className='max-w-lg flex flex-col gap-3' onSubmit={handleSetPassphrase}>
              <ElviraInput
                type='password'
                placeholder={t('profile.passphrase.placeholder')}
                invalidMessage={t('profile.passphrase.required')}
                required
                minLength={4}
                maxLength={256}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
              />

              <Button type='submit' disabled={isSubmitting} className='mt-1'>
                {isSubmitting
                  ? t('profile.passphrase.saving')
                  : t('profile.passphrase.saveButton')}
              </Button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default Profile;
