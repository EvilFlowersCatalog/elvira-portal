import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAdminUserActivity, { ActivityUnsupportedError } from '../../../hooks/api/activity/useAdminUserActivity';
import useTableParams from '../../../hooks/useTableParams';
import { fmtDateTime } from '../../../utils/func/adminDate';
import { IActivity } from '../../../utils/interfaces/activity';
import { Metadata } from '../../../utils/interfaces/general/general';
import DataTable, { DataTableColumn } from '../DataTable';
import StatusChip, { StatusVariant } from '../StatusChip';

const DEFAULT_LIMIT = 25;

const variantOf = (action: string): StatusVariant => {
  if (/(revoked|cancelled|expired|removed)$/.test(action)) return 'neutral';
  if (action.startsWith('loan')) return 'success';
  if (action.startsWith('reservation')) return 'warning';
  return 'info';
};

const fmt = (v?: string | null) => fmtDateTime(v) ?? '—';

/** What a user did in the library: reads, downloads, shelf changes, loans, reservations. */
export default function UserActivityPanel({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const getActivity = useAdminUserActivity();
  const { page, limit, orderBy, tableProps } = useTableParams({ limit: DEFAULT_LIMIT, orderBy: '-last_occurred_at' });

  const [items, setItems] = useState<IActivity[]>([]);
  const [metadata, setMetadata] = useState<Metadata>({ page: 1, limit: DEFAULT_LIMIT, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'load' | 'unsupported' | null>(null);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items, metadata } = await getActivity({ userId, page, limit, orderBy });
      setItems(items);
      setMetadata(metadata);
    } catch (e) {
      setError(e instanceof ActivityUnsupportedError ? 'unsupported' : 'load');
      setItems([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, page, limit, orderBy]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const columns: DataTableColumn<IActivity>[] = [
    {
      id: 'action',
      header: t('administration.userProfile.activity.action'),
      sortKey: 'action',
      hideable: false,
      cell: (a) => (
        <StatusChip variant={variantOf(a.action)} dot={false}>
          {t(`administration.userProfile.activity.actions.${a.action}`, { defaultValue: a.action })}
        </StatusChip>
      ),
    },
    {
      id: 'entry',
      header: t('administration.userProfile.activity.entry'),
      sortKey: 'entry__title',
      hideable: false,
      cell: (a) => <span className="font-medium text-secondary dark:text-secondaryLight">{a.entry?.title ?? '—'}</span>,
    },
    {
      id: 'count',
      header: t('administration.userProfile.activity.count'),
      sortKey: 'count',
      align: 'right',
      cell: (a) => `${a.count}×`,
    },
    {
      id: 'last',
      header: t('administration.userProfile.activity.last'),
      sortKey: 'last_occurred_at',
      cell: (a) => fmt(a.last_occurred_at),
    },
    {
      id: 'first',
      header: t('administration.userProfile.activity.first'),
      sortKey: 'created_at',
      defaultHidden: true,
      cell: (a) => fmt(a.created_at),
    },
  ];

  return (
    <DataTable<IActivity>
      caption={t('administration.userProfile.tabs.activity')}
      columns={columns}
      rows={items}
      getRowId={(a) => a.id}
      loading={loading}
      error={
        error === 'unsupported'
          ? t('administration.userProfile.activity.unsupported')
          : error === 'load'
            ? t('administration.userProfile.activity.loadError')
            : undefined
      }
      onRetry={error === 'load' ? fetchActivity : undefined}
      emptyTitle={t('administration.userProfile.activity.empty')}
      emptyDescription={t('administration.userProfile.activity.emptyHint')}
      page={metadata.page}
      pageCount={metadata.pages}
      total={metadata.total}
      pageSize={metadata.limit}
      {...tableProps}
      storageKey="admin-user-activity"
    />
  );
}
