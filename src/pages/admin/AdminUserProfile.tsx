import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiEdit2, FiPlus, FiUserCheck, FiUserX } from 'react-icons/fi';
import useAppContext from '../../hooks/contexts/useAppContext';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import useGetUserDetails from '../../hooks/api/users/useGetUserDetails';
import useUpdateUser from '../../hooks/api/users/useUpdateUser';
import { forgetUser } from '../../hooks/api/users/useUserLookup';
import { IUser } from '../../utils/interfaces/user';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { fmtDateTime } from '../../utils/func/adminDate';
import { withRememberedSearch } from '../../utils/func/listSearch';
import { StatusChip, Tabs, ConfirmDialog } from '../../components/admin';
import { userDisplayName } from '../../components/admin/UserLink';
import Button from '../../components/buttons/Button';
import UserDrawer from '../../components/admin/users/UserDrawer';
import UserCatalogsPanel from '../../components/admin/users/UserCatalogsPanel';
import UserActivityPanel from '../../components/admin/users/UserActivityPanel';
import LoansTable from '../../components/admin/loans/LoansTable';
import ReservationsTable from '../../components/admin/loans/ReservationsTable';
import GrantsTable from '../../components/admin/access/GrantsTable';
import ApiKeysTable from '../../components/admin/access/ApiKeysTable';

const TABS = ['catalogs', 'loans', 'reservations', 'activity', 'grants', 'keys'] as const;
type TabId = (typeof TABS)[number];

const OUTLINE_BTN =
  'inline-flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50';

const AdminUserProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { 'user-id': userId } = useParams();
  const { auth } = useAuthContext();
  const { setEditingEntryTitle } = useAppContext();
  const getUserDetails = useGetUserDetails();
  const updateUser = useUpdateUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [keyDrawerOpen, setKeyDrawerOpen] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [toggling, setToggling] = useState(false);
  // Totals reported by the tabs once visited, shown as tab badges.
  const [counts, setCounts] = useState<Partial<Record<TabId, number>>>({});

  const tabParam = searchParams.get('tab') as TabId | null;
  const tab: TabId = tabParam && TABS.includes(tabParam) ? tabParam : 'catalogs';

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setError(false);
    try {
      const detail = await getUserDetails(userId);
      setUser(detail);
      // The breadcrumb reads this to name the last crumb.
      setEditingEntryTitle(userDisplayName(detail));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    setUser(null);
    setCounts({});
    fetchUser();
    return () => setEditingEntryTitle('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUser]);

  const setCount = useCallback((id: TabId) => (total: number) => setCounts((c) => (c[id] === total ? c : { ...c, [id]: total })), []);

  const setActive = async (isActive: boolean) => {
    if (!user) return;
    setToggling(true);
    try {
      await updateUser(user.id, { name: user.name, surname: user.surname, is_active: isActive });
      forgetUser(user.id);
      toast.success(t(isActive ? 'administration.userProfile.activated' : 'administration.userProfile.deactivated'));
      await fetchUser();
    } catch {
      toast.error(t('administration.usersPage.saveError'));
    } finally {
      setToggling(false);
      setConfirmDeactivate(false);
    }
  };

  const fmt = (v?: string | null) => fmtDateTime(v) ?? t('administration.usersPage.never');

  const backLink = (
    <Link
      to={withRememberedSearch(NAVIGATION_PATHS.adminUsers)}
      className="mx-5 mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-primaryText dark:hover:text-primaryLight"
    >
      <FiArrowLeft size={15} />
      {t('administration.userProfile.back')}
    </Link>
  );

  if (loading) {
    return (
      <div className="pb-10">
        {backLink}
        <div className="mx-5 h-40 animate-pulse rounded-xl bg-zinc-200/70 dark:bg-zinc-800" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="pb-10">
        {backLink}
        <div className="mx-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-16 text-center">
          <p className="text-sm text-redText dark:text-red">{t('administration.userProfile.loadError')}</p>
          <button type="button" onClick={fetchUser} className="mt-3 text-sm font-medium text-primaryText dark:text-primaryLight hover:underline">
            {t('administration.table.retry')}
          </button>
        </div>
      </div>
    );
  }

  const isSelf = user.id === auth?.userId;
  const initials = `${user.name?.[0] ?? ''}${user.surname?.[0] ?? ''}`.toUpperCase() || user.username.slice(0, 2).toUpperCase();
  const catalogCount = Object.keys(user.catalog_permissions ?? {}).length;

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: t('administration.usersPage.lastLogin'), value: fmt(user.last_login) },
    { label: t('administration.usersPage.createdAt'), value: fmt(user.created_at) },
    { label: t('administration.usersPage.updatedAt'), value: fmt(user.updated_at) },
    {
      label: t('administration.userProfile.passphrase'),
      value: user.has_lcp_passphrase ? (
        <>
          {t('administration.userProfile.passphraseSet')}
          {user.lcp_passphrase_hint && (
            <span className="text-zinc-500 dark:text-zinc-400"> · {t('administration.userProfile.hint', { hint: user.lcp_passphrase_hint })}</span>
          )}
        </>
      ) : (
        <span className="text-zinc-500 dark:text-zinc-400">{t('administration.userProfile.passphraseMissing')}</span>
      ),
    },
  ];

  return (
    <div className="pb-10">
      {backLink}

      <div className="mx-5 mb-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primaryLight text-xl font-bold text-primaryText dark:bg-primaryDark dark:text-primaryLight"
            >
              {initials}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-secondary dark:text-secondaryLight">
                {userDisplayName(user)}
              </h1>
              <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{user.username}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {user.is_superuser ? (
                  <StatusChip variant="info">{t('administration.usersPage.admin')}</StatusChip>
                ) : (
                  <StatusChip variant="neutral" dot={false}>{t('administration.usersPage.student')}</StatusChip>
                )}
                {user.is_active ? (
                  <StatusChip variant="success">{t('administration.usersPage.active')}</StatusChip>
                ) : (
                  <StatusChip variant="danger">{t('administration.usersPage.inactive')}</StatusChip>
                )}
                {isSelf && <StatusChip variant="neutral" dot={false}>{t('administration.userProfile.you')}</StatusChip>}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {!isSelf && (
              <button
                type="button"
                disabled={toggling}
                onClick={() => (user.is_active ? setConfirmDeactivate(true) : setActive(true))}
                className={OUTLINE_BTN}
              >
                {user.is_active ? <FiUserX size={16} /> : <FiUserCheck size={16} />}
                {t(user.is_active ? 'administration.userProfile.deactivate' : 'administration.userProfile.activate')}
              </button>
            )}
            <Button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2">
              <FiEdit2 size={15} />
              {t('administration.userProfile.edit')}
            </Button>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-zinc-100 dark:border-zinc-700/60 pt-4 sm:grid-cols-2 xl:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{f.label}</dt>
              <dd className="mt-0.5 truncate text-sm text-zinc-700 dark:text-zinc-200">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pr-5">
        <Tabs
          label={t('administration.userProfile.sections')}
          active={tab}
          // Each tab has its own search, sort and page — start it clean.
          onChange={(id) => setSearchParams(id === 'catalogs' ? {} : { tab: id })}
          tabs={TABS.map((id) => ({
            id,
            label: t(`administration.userProfile.tabs.${id}`),
            count: id === 'catalogs' ? catalogCount : counts[id],
          }))}
          className="mb-0"
        />
        {tab === 'keys' && (
          <button type="button" onClick={() => setKeyDrawerOpen(true)} className={`${OUTLINE_BTN} ml-5 py-1.5`}>
            <FiPlus size={15} />
            {t('administration.accessPage.keys.add')}
          </button>
        )}
      </div>

      <div className="mt-3">
        {tab === 'catalogs' && <UserCatalogsPanel user={user} onChanged={fetchUser} />}
        {tab === 'loans' && <LoansTable userId={user.id} onTotal={setCount('loans')} />}
        {tab === 'reservations' && <ReservationsTable userId={user.id} onTotal={setCount('reservations')} />}
        {tab === 'activity' && <UserActivityPanel userId={user.id} />}
        {tab === 'grants' && <GrantsTable userId={user.id} onTotal={setCount('grants')} />}
        {tab === 'keys' && (
          <ApiKeysTable userId={user.id} createOpen={keyDrawerOpen} onCreateClose={() => setKeyDrawerOpen(false)} onTotal={setCount('keys')} />
        )}
      </div>

      <UserDrawer
        open={drawerOpen}
        user={user}
        mode="edit"
        onClose={() => setDrawerOpen(false)}
        onSaved={fetchUser}
        onDeleted={() => navigate(withRememberedSearch(NAVIGATION_PATHS.adminUsers), { replace: true })}
      />

      <ConfirmDialog
        open={confirmDeactivate}
        title={t('administration.userProfile.deactivateConfirmTitle')}
        message={t('administration.userProfile.deactivateConfirmBody', { name: userDisplayName(user) })}
        confirmLabel={t('administration.userProfile.deactivate')}
        cancelLabel={t('administration.usersPage.cancel')}
        destructive
        loading={toggling}
        onConfirm={() => setActive(false)}
        onCancel={() => setConfirmDeactivate(false)}
      />
    </div>
  );
};

export default AdminUserProfile;
