import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Metadata } from '../../../utils/interfaces/general/general';
import { useListAccessGrants, useRevokeAccessGrant, IAccessGrant } from '../../../hooks/api/access/useAdminAccessGrants';
import useTableParams from '../../../hooks/useTableParams';
import { fmtDate } from '../../../utils/func/adminDate';
import DataTable, { DataTableColumn } from '../DataTable';
import StatusChip from '../StatusChip';
import SearchField from '../SearchField';
import ConfirmDialog from '../ConfirmDialog';
import UserLink from '../UserLink';

const DEFAULT_LIMIT = 25;

interface GrantsTableProps {
  /** Restrict to one user's grants (profile view); hides the user column. */
  userId?: string;
  onTotal?: (total: number) => void;
}

/** Per-publication access grants with revoke. Used by the Access page and the user profile. */
export default function GrantsTable({ userId, onTotal }: GrantsTableProps) {
  const { t } = useTranslation();
  const listGrants = useListAccessGrants();
  const revokeGrant = useRevokeAccessGrant();
  const { page, limit, q, orderBy, setQuery, tableProps } = useTableParams({ limit: DEFAULT_LIMIT, orderBy: '-created_at' });

  const [grants, setGrants] = useState<IAccessGrant[]>([]);
  const [metadata, setMetadata] = useState<Metadata>({ page: 1, limit: DEFAULT_LIMIT, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<IAccessGrant | null>(null);

  const fetchGrants = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { items, metadata } = await listGrants({ page, limit, user_id: userId, query: q || undefined, orderBy });
      setGrants(items);
      setMetadata(metadata);
      onTotal?.(metadata.total);
    } catch {
      setError(true);
      setGrants([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, q, orderBy, userId]);

  useEffect(() => {
    fetchGrants();
  }, [fetchGrants]);

  const fmt = fmtDate;

  const columns: DataTableColumn<IAccessGrant>[] = [
    ...(userId
      ? []
      : [
          {
            id: 'user',
            header: t('administration.accessPage.grants.user'),
            sortKey: 'user__username',
            hideable: false,
            cell: (g: IAccessGrant) => (g.user ? <UserLink id={g.user.id} user={g.user} /> : '—'),
          } as DataTableColumn<IAccessGrant>,
        ]),
    {
      id: 'entry',
      header: t('administration.accessPage.grants.entry'),
      sortKey: 'acquisition__entry__title',
      hideable: userId ? false : undefined,
      cell: (g) => <span className="text-secondary dark:text-secondaryLight">{g.entry?.title ?? '—'}</span>,
    },
    {
      id: 'type',
      header: t('administration.accessPage.grants.type'),
      sortKey: 'type',
      cell: (g) => (
        <StatusChip variant="info" dot={false}>
          {t(`administration.accessPage.grants.types.${g.type}`, { defaultValue: g.type })}
        </StatusChip>
      ),
    },
    {
      id: 'created',
      header: t('administration.accessPage.grants.created'),
      sortKey: 'created_at',
      cell: (g) => fmt(g.created_at) ?? '—',
    },
    {
      id: 'expires',
      header: t('administration.accessPage.grants.expires'),
      sortKey: 'expire_at',
      cell: (g) => fmt(g.expire_at) ?? t('administration.accessPage.grants.noExpiry'),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      hideable: false,
      cell: (g) => (
        <button
          type="button"
          onClick={() => setPendingRevoke(g)}
          className="rounded-md border border-red/30 px-2.5 py-1 text-xs font-medium text-redText dark:text-red hover:bg-red/10"
        >
          {t('administration.accessPage.grants.revoke')}
        </button>
      ),
    },
  ];

  const searchLabel = t(userId ? 'administration.loansPage.searchTitlePlaceholder' : 'administration.accessPage.grants.searchPlaceholder');

  return (
    <>
      <DataTable<IAccessGrant>
        caption={t('administration.accessPage.tabGrants')}
        columns={columns}
        rows={grants}
        getRowId={(g) => g.id}
        loading={loading}
        error={error ? t('administration.accessPage.grants.loadError') : undefined}
        onRetry={fetchGrants}
        emptyTitle={t('administration.accessPage.grants.empty')}
        emptyDescription={t('administration.accessPage.grants.emptyHint')}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit}
        {...tableProps}
        storageKey={userId ? 'admin-user-grants' : 'admin-grants'}
        toolbar={<SearchField value={q} onChange={setQuery} label={searchLabel} placeholder={searchLabel} className="max-w-sm" />}
      />

      <ConfirmDialog
        open={pendingRevoke !== null}
        title={t('administration.accessPage.grants.revokeConfirmTitle')}
        message={t('administration.accessPage.grants.revokeConfirmBody', {
          user: pendingRevoke?.user?.username ?? '',
          entry: pendingRevoke?.entry?.title ?? '',
        })}
        confirmLabel={t('administration.accessPage.grants.revoke')}
        cancelLabel={t('administration.accessPage.keys.cancel')}
        destructive
        onConfirm={async () => {
          if (pendingRevoke) {
            try {
              await revokeGrant(pendingRevoke.id);
              toast.success(t('administration.accessPage.grants.revoked'));
              fetchGrants();
            } catch {
              toast.error(t('administration.accessPage.grants.revokeError'));
            }
          }
          setPendingRevoke(null);
        }}
        onCancel={() => setPendingRevoke(null)}
      />
    </>
  );
}
