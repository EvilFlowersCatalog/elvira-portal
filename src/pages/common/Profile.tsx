import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import PopupInfo from '../../components/common/PopupInfo';
import Button from '../../components/buttons/Button';
import ElviraInput from '../../components/inputs/ElviraInput';
import PageLoading from '../../components/page/PageLoading';
import PageMessage from '../../components/page/PageMessage';
import { H1 } from '../../components/primitives/Heading';
import useGetUserDetails from '../../hooks/api/users/useGetUserDetails';
import useSetUserPassphrase from '../../hooks/api/users/useSetUserPassphrase';
import useGetShelf from '../../hooks/api/my-shelf/useGetShelf';
import useGetLicenses from '../../hooks/api/licenses/useGetLicenses';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import { IUser } from '../../utils/interfaces/user';
import { LICENSE_STATE } from '../../utils/interfaces/license';
import { BookmarkIcon, ClockIcon, LibraryIcon, LoansIcon } from '../../components/header/navbar/NavbarIcons';

type NotificationKey = 'loanEnd' | 'newBooks' | 'reservationChange';

const Profile = () => {
  const { t } = useTranslation();
  const { auth } = useAuthContext();

  const getUserDetails = useGetUserDetails();
  const setUserPassphrase = useSetUserPassphrase();
  const getShelf = useGetShelf();
  const getLicenses = useGetLicenses();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState<IUser | null>(null);
  const [passphrase, setPassphrase] = useState<string>('');
  const [passphraseHint, setPassphraseHint] = useState<string>('');
  const [bookmarksCount, setBookmarksCount] = useState<number>(0);
  const [loansCount, setLoansCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    loanEnd: false,
    newBooks: false,
    reservationChange: false,
  });

  useEffect(() => {
    if (!auth) return;
    let mounted = true;

    (async () => {
      try {
        const details = await getUserDetails(auth.userId);
        if (mounted) setUserDetails(details);
      } catch {
        if (mounted) setIsError(true);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [auth?.userId]);

  useEffect(() => {
    if (!auth) return;
    let mounted = true;

    (async () => {
      try {
        const [shelfData, licenseData] = await Promise.all([
          getShelf({ page: 1, limit: 1 }),
          getLicenses({ user_mode: 'current', page: 1, limit: 50 }),
        ]);
        if (!mounted) return;

        setBookmarksCount(shelfData.metadata.total);

        const now = new Date();
        const active = licenseData.items.filter((l) => {
          const isActiveState = l.state === LICENSE_STATE.active || (l.state as string) === 'ready';
          return isActiveState && new Date(l.starts_at) <= now && new Date(l.expires_at) > now;
        });
        setLoansCount(active.length);
      } catch {
        // counts stay 0 on error
      }
    })();

    return () => { mounted = false; };
  }, [auth?.userId]);

  useEffect(() => {
    setPassphraseHint(userDetails?.lcp_passphrase_hint || '');
  }, [userDetails?.lcp_passphrase_hint]);

  const userEmail = useMemo(() => {
    if (userDetails?.username) return `${userDetails.username}@stuba.sk`;
    if (auth?.username) return `${auth.username}@stuba.sk`;
    return '-';
  }, [auth?.username, userDetails?.username]);

  if (!auth) return null;

  const userName = userDetails?.username || auth?.username || '';
  const userInitial = (auth.name?.[0] || auth.username?.[0] || 'U').toUpperCase();

  const formatDate = (value: string | undefined) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
  };

  const handleSetPassphrase = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passphrase.trim()) return;

    try {
      setIsSubmitting(true);
      await setUserPassphrase({
        userId: auth.userId,
        name: userDetails?.name || auth.name,
        surname: userDetails?.surname || auth.surname,
        is_active: userDetails?.is_active ?? true,
        lcp_passphrase: passphrase,
        lcp_passphrase_hint: passphraseHint,
      });
      toast.success(t('profile.passphrase.success'));
      setPassphrase('');
    } catch {
      toast.error(t('profile.passphrase.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleNotification = (key: NotificationKey) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const notificationItems: { key: NotificationKey; label: string; desc: string }[] = [
    { key: 'loanEnd', label: t('profile.notifications.loanEnd'), desc: t('profile.notifications.loanEndDesc') },
    { key: 'newBooks', label: t('profile.notifications.newBooks'), desc: t('profile.notifications.newBooksDesc') },
    { key: 'reservationChange', label: t('profile.notifications.reservationChange'), desc: t('profile.notifications.reservationChangeDesc') },
  ];

  const stats = [
    { labelKey: 'profile.stats.readBooks', value: 0, icon: <LibraryIcon size={22} className='text-secondary dark:text-secondaryLight' /> },
    { labelKey: 'profile.stats.savedBooks', value: bookmarksCount, icon: <BookmarkIcon size={22} className='text-secondary dark:text-secondaryLight' /> },
    { labelKey: 'profile.stats.borrowedBooks', value: loansCount, icon: <LoansIcon size={22} className='text-secondary dark:text-secondaryLight' /> },
    { labelKey: 'profile.stats.readingHours', value: 0, icon: <ClockIcon size={22} className='text-secondary dark:text-secondaryLight' /> },
  ] as const;

  return (
    <div className='w-full h-full overflow-auto pb-10'>
      <Breadcrumb />
      <H1>{t('profile.title')}</H1>

      {isLoading && <PageLoading />}
      {!isLoading && isError && <PageMessage message={t('page.error')} />}

      {!isLoading && !isError && (
        <div className='px-4 flex flex-col gap-5'>
          {/* Personal info card */}
          <section className='rounded-[9px] p-5 bg-white dark:bg-zinc-800 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] dark:shadow-[0px_4px_12px_0px_rgba(0,0,0,0.3)] border border-[#e5e5e5] dark:border-zinc-700'>
            <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight mb-4'>
              {t('profile.personalInfo.title')}
            </h2>
            <div className='flex flex-wrap items-start gap-5'>
              <div className='w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0'>
                <span className='text-2xl font-bold text-zinc-500 dark:text-zinc-300'>{userInitial}</span>
              </div>
              <div className='flex-1 min-w-[240px]'>
                <p className='text-xl font-bold text-secondary dark:text-secondaryLight mb-3'>{userName}</p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4'>
                  <div className='flex flex-col gap-1'>
                    <span className='text-xs text-zinc-500 dark:text-zinc-400'>{t('profile.fields.email')}</span>
                    <span className='text-sm font-medium text-secondary dark:text-secondaryLight'>{userEmail}</span>
                  </div>
                  <div className='flex flex-col gap-1'>
                    <span className='text-xs text-zinc-500 dark:text-zinc-400'>{t('profile.fields.accountType')}</span>
                    <span className='text-sm font-medium text-secondary dark:text-secondaryLight'>
                      {auth.isSuperUser ? t('navbarMenu.superUser') : t('navbarMenu.user')}
                    </span>
                  </div>
                  <div className='flex flex-col gap-1'>
                    <span className='text-xs text-zinc-500 dark:text-zinc-400'>{t('profile.fields.memberSince')}</span>
                    <span className='text-sm font-medium text-secondary dark:text-secondaryLight'>{formatDate(userDetails?.created_at)}</span>
                  </div>
                  <div className='flex flex-col gap-1'>
                    <span className='text-xs text-zinc-500 dark:text-zinc-400'>{t('profile.fields.lastLogin')}</span>
                    <span className='text-sm font-medium text-secondary dark:text-secondaryLight'>{formatDate(userDetails?.last_login)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats row */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
            {stats.map(({ labelKey, value, icon }) => (
              <div
                key={labelKey}
                className='bg-white dark:bg-zinc-800 rounded-[8px] shadow-[0px_4px_6px_rgba(0,0,0,0.1)] dark:shadow-[0px_4px_6px_rgba(0,0,0,0.3)] h-[69px] flex items-center px-3 gap-3'
              >
                <div className='w-10 h-10 rounded-[6px] bg-primaryLight dark:bg-zinc-700 flex items-center justify-center flex-shrink-0'>
                  {icon}
                </div>
                <div>
                  <p className='text-[12px] font-light text-secondary dark:text-secondaryLight'>{t(labelKey)}</p>
                  <p className='text-[20px] font-extrabold text-secondary dark:text-secondaryLight leading-tight'>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom two-column section */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
            {/* Passphrase section */}
            <section className='rounded-[7px] p-5 bg-white dark:bg-zinc-800 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] dark:shadow-[0px_4px_12px_0px_rgba(0,0,0,0.3)] border border-[#e5e5e5] dark:border-zinc-700'>
              <div className='flex items-center gap-2 mb-4'>
                <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight'>
                  {t('profile.passphrase.title')}
                </h2>
                <PopupInfo label='Info o prístupovej fráze'>
                  Knihy sú dostupné vo formáte PDF. Na ich otvorenie odporúčame aplikáciu{' '}
                  <a href='https://thorium.edrlab.org/en/' target='_blank' rel='noopener noreferrer' className='text-primary underline'>
                    Thorium Reader
                  </a>
                  , ktorá je bezplatná a dostupná pre Windows, macOS aj Linux. Pri prvom otvorení súboru vás čítačka požiada o zadanie prístupovej frázy na odomknutie.
                </PopupInfo>
              </div>
              <form className='flex flex-col gap-3' onSubmit={handleSetPassphrase}>
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
                <ElviraInput
                  type='text'
                  placeholder={t('profile.passphrase.hintPlaceholder')}
                  maxLength={256}
                  value={passphraseHint}
                  onChange={(e) => setPassphraseHint(e.target.value)}
                />
                <div className='flex justify-center mt-1'>
                  <Button type='submit' disabled={isSubmitting}>
                    {isSubmitting ? t('profile.passphrase.saving') : t('profile.passphrase.saveButton')}
                  </Button>
                </div>
              </form>
            </section>

            {/* Notifications section */}
            <section className='rounded-[7px] p-5 bg-white dark:bg-zinc-800 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] dark:shadow-[0px_4px_12px_0px_rgba(0,0,0,0.3)] border border-[#e5e5e5] dark:border-zinc-700'>
              <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight mb-4'>
                {t('profile.notifications.title')}
              </h2>
              <div className='flex flex-col divide-y divide-zinc-100 dark:divide-zinc-700'>
                {notificationItems.map(({ key, label, desc }) => (
                  <div key={key} className='flex items-center justify-between py-4 first:pt-0 last:pb-0'>
                    <div className='mr-4'>
                      <p className='text-sm font-semibold text-secondary dark:text-secondaryLight'>{label}</p>
                      <p className='text-xs font-light text-secondary dark:text-zinc-400 mt-0.5'>{desc}</p>
                    </div>
                    <button
                      type='button'
                      role='switch'
                      aria-checked={notifications[key]}
                      onClick={() => toggleNotification(key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                        notifications[key] ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${
                          notifications[key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
