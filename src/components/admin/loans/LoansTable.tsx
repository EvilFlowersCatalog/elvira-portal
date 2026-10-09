import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { fmtDate } from '../../../utils/func/adminDate';
import useGetLicenses from '../../../hooks/api/licenses/useGetLicenses';
import useUpdateLicenseState from '../../../hooks/api/licenses/useUpdateLicense';
import useUserLookup from '../../../hooks/api/users/useUserLookup';
import useTableParams from '../../../hooks/useTableParams';
import { ILicense, LICENSE_ACTION, LICENSE_STATE } from '../../../utils/interfaces/license';
import { Metadata } from '../../../utils/interfaces/general/general';
import DataTable, { DataTableColumn } from '../DataTable';
import StatusChip, { StatusVariant } from '../StatusChip';
import SearchField from '../SearchField';
import ConfirmDialog from '../ConfirmDialog';
import UserLink from '../UserLink';

const DEFAULT_LIMIT = 10;
// Newest loans first; the API's own default is oldest-created first.
const DEFAULT_ORDER = '-starts_at';

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

const DESTRUCTIVE: LICENSE_ACTION[] = [LICENSE_ACTION.revoked, LICENSE_ACTION.cancelled];

const fmt = (v?: string | null) => fmtDate(v) ?? '—';

interface LoansTableProps {
  /** Restrict to one user's loans (profile view); hides the user column. */
  userId?: string;
  onTotal?: (total: number) => void;
}

/** Loans with state actions. Used by the Loans page and the user profile. */
export default function LoansTable({ userId, onTotal }: LoansTableProps) {
  const { t } = useTranslation();
  const getLoans = useGetLicenses();
  const updateLoan = useUpdateLicenseState();
  const { page, limit, q, orderBy, setQuery, tableProps } = useTableParams({ limit: DEFAULT_LIMIT, orderBy: DEFAULT_ORDER });

  const [items, setItems] = useState<ILicense[]>([]);
  const [metadata, setMetadata] = useState<Metadata>({ page: 1, limit: DEFAULT_LIMIT, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ license: ILicense; action: LICENSE_ACTION } | null>(null);

  const users = useUserLookup(userId ? [] : items.map((l) => l.user_id));

  const fetchLoans = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(false);
      try {
        const { items, metadata } = await getLoans({
          page,
          limit,
          user_mode: userId ? 'query' : 'all',
          user_id: userId,
          query: q || undefined,
          orderBy,
        });
        setItems(items);
        setMetadata(metadata);
        onTotal?.(metadata.total);
      } catch {
        setError(true);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, limit, q, orderBy, userId]
  );

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const runAction = async (license: ILicense, action: LICENSE_ACTION) => {
    // Policy-driven renewal window instead of a hardcoded 7 days.
    let requested_end: string | undefined;
    if (action === LICENSE_ACTION.renewed) {
      const days = license.renew_policy?.max_renew_days;
      if (days) requested_end = new Date(Date.now() + days * 86_400_000).toISOString();
    }
    try {
      await updateLoan(license.id, action, requested_end);
      toast.success(t('administration.loansPage.actionDone'));
      // The PUT response doesn't reliably carry the new state — reload the page of loans.
      await fetchLoans(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || t('notifications.license.edit.error', { defaultValue: 'Action failed' }));
    }
  };

  const onAction = (license: ILicense, action: LICENSE_ACTION) => {
    if (DESTRUCTIVE.includes(action)) setPendingAction({ license, action });
    else runAction(license, action);
  };

  const columns: DataTableColumn<ILicense>[] = [
    {
      id: 'title',
      header: t('administration.loansPage.table.entry'),
      hideable: false,
      sortKey: 'entry__title',
      cell: (l) => <span className="font-medium text-secondary dark:text-secondaryLight">{l.entry?.title || '—'}</span>,
    },
    ...(userId
      ? []
      : [
          {
            id: 'user',
            header: t('administration.loansPage.table.user'),
            sortKey: 'user__surname',
            cell: (l: ILicense) => <UserLink id={l.user_id} user={users[l.user_id]} />,
          } as DataTableColumn<ILicense>,
        ]),
    {
      id: 'state',
      header: t('administration.loansPage.table.state'),
      sortKey: 'state',
      cell: (l) => (
        <StatusChip variant={STATE_VARIANT[l.state] ?? 'neutral'}>
          {t(`administration.loansPage.states.${l.state}`, { defaultValue: l.state })}
        </StatusChip>
      ),
    },
    { id: 'starts_at', header: t('administration.loansPage.table.starts_at'), sortKey: 'starts_at', cell: (l) => fmt(l.starts_at) },
    { id: 'ends_at', header: t('administration.loansPage.table.ends_at'), sortKey: 'expires_at', cell: (l) => fmt(l.expires_at) },
    {
      id: 'renewals',
      header: t('administration.loansPage.table.renewals'),
      sortKey: 'renewal_count',
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

  return (
    <>
      <DataTable<ILicense>
        caption={t('administration.loansPage.tableTitle', { x: metadata.total })}
        columns={columns}
        rows={items}
        getRowId={(l) => l.id}
        loading={loading}
        error={error ? t('administration.loansPage.loadError') : undefined}
        onRetry={() => fetchLoans()}
        emptyTitle={t('administration.loansPage.empty')}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit}
        {...tableProps}
        storageKey={userId ? 'admin-user-loans' : 'admin-loans'}
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
    </>
  );
}
