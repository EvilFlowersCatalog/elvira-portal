import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { fmtDate } from '../../../utils/func/adminDate';
import { useAdminCancelReservation, useListAdminReservations } from '../../../hooks/api/reservations/useAdminReservations';
import useUserLookup from '../../../hooks/api/users/useUserLookup';
import useTableParams from '../../../hooks/useTableParams';
import { IReservation, NON_TERMINAL_RESERVATION_STATUSES } from '../../../utils/interfaces/reservation';
import { Metadata } from '../../../utils/interfaces/general/general';
import DataTable, { DataTableColumn } from '../DataTable';
import StatusChip, { StatusVariant } from '../StatusChip';
import SearchField from '../SearchField';
import ConfirmDialog from '../ConfirmDialog';
import UserLink from '../UserLink';

const DEFAULT_LIMIT = 10;

const RES_VARIANT: Record<string, StatusVariant> = {
  queued: 'info',
  available: 'success',
  claimed: 'neutral',
  expired: 'neutral',
  cancelled: 'danger',
};

const fmt = (v?: string | null) => fmtDate(v) ?? '—';

interface ReservationsTableProps {
  /** Restrict to one user's reservations (profile view); hides the user column. */
  userId?: string;
  onTotal?: (total: number) => void;
}

/** The reservation queue across the library. Used by the Loans page and the user profile. */
export default function ReservationsTable({ userId, onTotal }: ReservationsTableProps) {
  const { t } = useTranslation();
  const listReservations = useListAdminReservations();
  const cancelReservation = useAdminCancelReservation();
  const { page, limit, q, orderBy, setQuery, tableProps } = useTableParams({ limit: DEFAULT_LIMIT, orderBy: '-requested_at' });

  const [items, setItems] = useState<IReservation[]>([]);
  const [metadata, setMetadata] = useState<Metadata>({ page: 1, limit: DEFAULT_LIMIT, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingCancel, setPendingCancel] = useState<IReservation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const users = useUserLookup(userId ? [] : items.map((r) => r.user_id));

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { items, metadata } = await listReservations({ page, limit, userId, query: q || undefined, orderBy });
      setItems(items ?? []);
      setMetadata(metadata);
      onTotal?.(metadata.total);
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, q, orderBy, userId]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const doCancel = async () => {
    if (!pendingCancel) return;
    setCancelling(true);
    try {
      await cancelReservation(pendingCancel.id);
      toast.success(t('administration.loansPage.reservations.cancelled'));
      fetchReservations();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || t('administration.loansPage.reservations.cancelError'));
    } finally {
      setCancelling(false);
      setPendingCancel(null);
    }
  };

  const columns: DataTableColumn<IReservation>[] = [
    {
      id: 'title',
      header: t('administration.loansPage.table.entry'),
      hideable: false,
      sortKey: 'entry__title',
      cell: (r) => <span className="font-medium text-secondary dark:text-secondaryLight">{r.entry?.title || '—'}</span>,
    },
    ...(userId
      ? []
      : [
          {
            id: 'user',
            header: t('administration.loansPage.table.user'),
            sortKey: 'user__surname',
            cell: (r: IReservation) => <UserLink id={r.user_id} user={users[r.user_id]} />,
          } as DataTableColumn<IReservation>,
        ]),
    {
      id: 'position',
      header: t('administration.loansPage.reservations.position'),
      sortKey: 'position',
      align: 'right',
      cell: (r) => `#${r.position}`,
    },
    {
      id: 'status',
      header: t('administration.loansPage.reservations.status'),
      sortKey: 'status',
      cell: (r) => (
        <StatusChip variant={RES_VARIANT[r.status] ?? 'neutral'}>
          {t(`administration.loansPage.reservations.statuses.${r.status}`, { defaultValue: r.status })}
        </StatusChip>
      ),
    },
    { id: 'requested', header: t('administration.loansPage.reservations.requestedAt'), sortKey: 'requested_at', cell: (r) => fmt(r.requested_at) },
    { id: 'available', header: t('administration.loansPage.reservations.availableAt'), sortKey: 'available_at', cell: (r) => fmt(r.available_at) },
    { id: 'claim', header: t('administration.loansPage.reservations.claimDeadline'), sortKey: 'claim_deadline', cell: (r) => fmt(r.claim_deadline) },
    {
      id: 'actions',
      header: t('administration.loansPage.table.actions'),
      hideable: false,
      align: 'right',
      cell: (r) =>
        NON_TERMINAL_RESERVATION_STATUSES.includes(r.status) ? (
          <button
            type="button"
            onClick={() => setPendingCancel(r)}
            className="rounded-md border border-red/30 px-2.5 py-1 text-xs font-medium text-redText dark:text-red hover:bg-red/10"
          >
            {t('administration.loansPage.actions.cancelled')}
          </button>
        ) : (
          <span className="text-zinc-400">—</span>
        ),
    },
  ];

  return (
    <>
      <DataTable<IReservation>
        caption={t('administration.loansPage.reservations.title')}
        columns={columns}
        rows={items}
        getRowId={(r) => r.id}
        loading={loading}
        error={error ? t('administration.loansPage.reservations.loadError') : undefined}
        onRetry={fetchReservations}
        emptyTitle={t('administration.loansPage.reservations.empty')}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit ?? limit}
        {...tableProps}
        storageKey={userId ? 'admin-user-reservations' : 'admin-reservations'}
        toolbar={
          <SearchField
            value={q}
            onChange={setQuery}
            label={t(userId ? 'administration.loansPage.searchTitlePlaceholder' : 'administration.loansPage.searchPlaceholder')}
            placeholder={t(userId ? 'administration.loansPage.searchTitlePlaceholder' : 'administration.loansPage.searchPlaceholder')}
            className="max-w-sm"
          />
        }
      />

      <ConfirmDialog
        open={pendingCancel !== null}
        title={t('administration.loansPage.reservations.cancelConfirmTitle')}
        message={t('administration.loansPage.reservations.cancelConfirmBody', { entry: pendingCancel?.entry?.title ?? '' })}
        confirmLabel={t('administration.loansPage.confirm')}
        cancelLabel={t('administration.loansPage.cancelBtn')}
        destructive
        loading={cancelling}
        onConfirm={doCancel}
        onCancel={() => setPendingCancel(null)}
      />
    </>
  );
}
