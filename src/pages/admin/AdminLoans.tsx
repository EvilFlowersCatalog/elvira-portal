import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatDate } from 'date-fns';
import useGetLicenses from '../../hooks/api/licenses/useGetLicenses';
import useUpdateLicenseState from '../../hooks/api/licenses/useUpdateLicense';
import useGetUsers from '../../hooks/api/users/useGetUsers';
import useGetReservations from '../../hooks/api/reservations/useGetReservations';
import { ILicense, ILicenseEntry, LICENSE_ACTION, LICENSE_STATE } from '../../utils/interfaces/license';
import { IReservation, RESERVATION_STATUS } from '../../utils/interfaces/reservation';
import { Metadata } from '../../utils/interfaces/general/general';
import {
  PageHeader,
  DataTable,
  DataTableColumn,
  StatusChip,
  StatusVariant,
  SearchField,
  ConfirmDialog,
} from '../../components/admin';

const DEFAULT_LIMIT = 10;

// Valid license state-machine transitions — never offer an action the API rejects.
const VALID_ACTIONS: Partial<Record<LICENSE_STATE, LICENSE_ACTION[]>> = {
  [LICENSE_STATE.ready]: [LICENSE_ACTION.active, LICENSE_ACTION.cancelled],
  [LICENSE_STATE.active]: [LICENSE_ACTION.returned, LICENSE_ACTION.renewed, LICENSE_ACTION.revoked],
};

const STATE_VARIANT: Record<string, StatusVariant> = {
  ready: 'info',
  active: 'success',
  returned: 'neutral',
  expired: 'neutral',
  revoked: 'danger',
  cancelled: 'neutral',
};

const RES_VARIANT: Record<string, StatusVariant> = {
  queued: 'info',
  available: 'success',
  claimed: 'neutral',
  expired: 'neutral',
  cancelled: 'danger',
};

const DESTRUCTIVE: LICENSE_ACTION[] = [LICENSE_ACTION.revoked, LICENSE_ACTION.cancelled];

const fmt = (v?: string | null) => (v ? formatDate(new Date(v), 'dd.MM.yyyy') : '—');
const entryTitle = (e?: ILicenseEntry) => e?.title || '—';

const AdminLoans = () => {
  const { t } = useTranslation();
  const getLoans = useGetLicenses();
  const updateLoan = useUpdateLicenseState();
  const getUsers = useGetUsers();
  const getReservations = useGetReservations();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get('tab') === 'reservations' ? 'reservations' : 'loans';

  // ---- Loans ----
  const [items, setItems] = useState<ILicense[]>([]);
  const [metadata, setMetadata] = useState<Metadata>({ page: 1, limit: DEFAULT_LIMIT, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<{ license: ILicense; action: LICENSE_ACTION } | null>(null);

  // ---- Reservations ----
  const [reservations, setReservations] = useState<IReservation[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [resError, setResError] = useState(false);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
  const q = (searchParams.get('q') || '').toLowerCase();

  const patchParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  // Fetch all users ONCE and map id -> name (kills the per-row N+1 lookup).
  useEffect(() => {
    getUsers({})
      .then(({ items }) => {
        const map: Record<string, string> = {};
        items.forEach((u) => (map[u.id] = `${u.name ?? ''} ${u.surname ?? ''}`.trim() || u.username));
        setUserMap(map);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { items, metadata } = await getLoans({ page, limit, user_mode: 'all' });
      setItems(items);
      setMetadata(metadata);
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const fetchReservations = useCallback(async () => {
    setResLoading(true);
    setResError(false);
    try {
      setReservations(await getReservations({ page: 1, limit: 50 }));
    } catch {
      setResError(true);
      setReservations([]);
    } finally {
      setResLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === 'loans') fetchLoans();
    else fetchReservations();
  }, [tab, fetchLoans, fetchReservations]);

  const runAction = async (license: ILicense, action: LICENSE_ACTION) => {
    // Policy-driven renewal window instead of a hardcoded 7 days.
    let requested_end: string | undefined;
    if (action === LICENSE_ACTION.renewed) {
      const days = license.renew_policy?.max_renew_days;
      if (days) requested_end = new Date(Date.now() + days * 86_400_000).toISOString();
    }
    try {
      const updated = await updateLoan(license.id, action, requested_end);
      setItems((prev) => prev.map((l) => (l.id === license.id ? { ...l, ...updated } : l)));
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || t('notifications.license.edit.error', { defaultValue: 'Action failed' }));
    }
  };

  const onAction = (license: ILicense, action: LICENSE_ACTION) => {
    if (DESTRUCTIVE.includes(action)) setPendingAction({ license, action });
    else runAction(license, action);
  };

  const visibleLoans = useMemo(
    () => (q ? items.filter((l) => entryTitle(l.entry).toLowerCase().includes(q)) : items),
    [items, q]
  );

  const loanColumns: DataTableColumn<ILicense>[] = [
    {
      id: 'title',
      header: t('administration.loansPage.table.entry'),
      hideable: false,
      cell: (l) => <span className="font-medium text-secondary dark:text-secondaryLight">{entryTitle(l.entry)}</span>,
    },
    {
      id: 'user',
      header: t('administration.loansPage.table.user'),
      cell: (l) => userMap[l.user_id] ?? '…',
    },
    {
      id: 'state',
      header: t('administration.loansPage.table.state'),
      cell: (l) => <StatusChip variant={STATE_VARIANT[l.state] ?? 'neutral'}>{t(`license.loansPage.table.states.${l.state}`, { defaultValue: l.state })}</StatusChip>,
    },
    { id: 'starts_at', header: t('administration.loansPage.table.starts_at'), cell: (l) => fmt(l.starts_at) },
    { id: 'ends_at', header: t('administration.loansPage.table.ends_at'), cell: (l) => fmt(l.expires_at) },
    {
      id: 'renewals',
      header: t('administration.loansPage.table.renewals'),
      defaultHidden: true,
      cell: (l) =>
        l.renewals_remaining == null
          ? t('administration.loansPage.renewalsUncapped')
          : t('administration.loansPage.renewalsLeft', { count: l.renewals_remaining }),
    },
    {
      id: 'actions',
      header: t('administration.loansPage.table.actions'),
      hideable: false,
      align: 'right',
      cell: (l) => {
        const actions = VALID_ACTIONS[l.state] ?? [];
        if (actions.length === 0) return <span className="text-zinc-400">—</span>;
        return (
          <div className="flex flex-wrap justify-end gap-1.5">
            {actions.map((a) => {
              const renewBlocked = a === LICENSE_ACTION.renewed && l.renewals_remaining === 0;
              const destructive = DESTRUCTIVE.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  disabled={renewBlocked}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(l, a);
                  }}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium disabled:opacity-40 ${
                    destructive
                      ? 'border-red/30 text-redText dark:text-red hover:bg-red/10'
                      : 'border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  {t(`administration.loansPage.actions.${a}`, { defaultValue: a })}
                </button>
              );
            })}
          </div>
        );
      },
    },
  ];

  const resColumns: DataTableColumn<IReservation>[] = [
    {
      id: 'title',
      header: t('administration.loansPage.table.entry'),
      hideable: false,
      cell: (r) => <span className="font-medium text-secondary dark:text-secondaryLight">{entryTitle(r.entry)}</span>,
    },
    { id: 'position', header: t('administration.loansPage.reservations.position'), align: 'right', cell: (r) => `#${r.position}` },
    {
      id: 'status',
      header: t('administration.loansPage.reservations.status'),
      cell: (r) => <StatusChip variant={RES_VARIANT[r.status] ?? 'neutral'}>{t(`administration.loansPage.reservations.statuses.${r.status}`, { defaultValue: r.status })}</StatusChip>,
    },
    { id: 'requested', header: t('administration.loansPage.reservations.requestedAt'), cell: (r) => fmt(r.requested_at) },
    { id: 'available', header: t('administration.loansPage.reservations.availableAt'), cell: (r) => fmt(r.available_at) },
    { id: 'claim', header: t('administration.loansPage.reservations.claimDeadline'), cell: (r) => fmt(r.claim_deadline) },
  ];

  const TabButton = ({ id, label }: { id: string; label: string }) => (
    <button
      onClick={() => patchParams({ tab: id === 'loans' ? null : id, page: null })}
      aria-current={tab === id ? 'page' : undefined}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        tab === id
          ? 'bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight'
          : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="pb-10">
      <PageHeader title={t('administration.loansPage.title')} description={t('administration.loansPage.description')} />

      <div className="mb-1 flex gap-2 px-5">
        <TabButton id="loans" label={t('administration.loansPage.tabLoans')} />
        <TabButton id="reservations" label={t('administration.loansPage.tabReservations')} />
      </div>

      {tab === 'loans' ? (
        <DataTable<ILicense>
          caption={t('administration.loansPage.tableTitle', { x: metadata.total })}
          columns={loanColumns}
          rows={visibleLoans}
          getRowId={(l) => l.id}
          loading={loading}
          error={error ? t('administration.loansPage.loadError') : undefined}
          onRetry={fetchLoans}
          emptyTitle={t('administration.loansPage.empty')}
          page={metadata.page}
          pageCount={metadata.pages}
          total={metadata.total}
          pageSize={metadata.limit}
          onPageChange={(p) => patchParams({ page: String(p) })}
          onPageSizeChange={(n) => patchParams({ limit: String(n), page: '1' })}
          storageKey="admin-loans"
          toolbar={
            <SearchField
              value={searchParams.get('q') || ''}
              onChange={(v) => patchParams({ q: v || null })}
              label={t('administration.loansPage.searchPlaceholder')}
              placeholder={t('administration.loansPage.searchPlaceholder')}
              className="max-w-sm"
            />
          }
        />
      ) : (
        <>
          <p className="px-5 pt-1 text-xs text-zinc-400 dark:text-zinc-500">{t('administration.loansPage.reservations.note')}</p>
          <DataTable<IReservation>
            caption={t('administration.loansPage.reservations.title')}
            columns={resColumns}
            rows={reservations}
            getRowId={(r) => r.id}
            loading={resLoading}
            error={resError ? t('administration.loansPage.reservations.loadError') : undefined}
            onRetry={fetchReservations}
            emptyTitle={t('administration.loansPage.reservations.empty')}
          />
        </>
      )}

      <ConfirmDialog
        open={pendingAction !== null}
        title={t('administration.loansPage.confirmTitle')}
        message={
          pendingAction?.action === LICENSE_ACTION.revoked
            ? t('administration.loansPage.confirmRevoke')
            : t('administration.loansPage.confirmCancel')
        }
        confirmLabel={t('administration.loansPage.confirm')}
        cancelLabel={t('administration.loansPage.cancelBtn')}
        destructive
        onConfirm={() => {
          if (pendingAction) runAction(pendingAction.license, pendingAction.action);
          setPendingAction(null);
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
};

export default AdminLoans;
