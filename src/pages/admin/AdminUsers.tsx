import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import useGetUsers from '../../hooks/api/users/useGetUsers';
import { IUser } from '../../utils/interfaces/user';
import { Metadata } from '../../utils/interfaces/general/general';
import {
  PageHeader,
  DataTable,
  DataTableColumn,
  SortState,
  StatusChip,
  SearchField,
} from '../../components/admin';
import Button from '../../components/buttons/Button';
import UserDrawer from '../../components/admin/users/UserDrawer';

const DEFAULT_LIMIT = 10;

const AdminUsers = () => {
  const { t } = useTranslation();
  const getUsers = useGetUsers();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<IUser[]>([]);
  const [metadata, setMetadata] = useState<Metadata>({ page: 1, limit: DEFAULT_LIMIT, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('edit');
  const [activeUser, setActiveUser] = useState<IUser | null>(null);

  // Derive request state from the URL (shareable, back-button friendly).
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
  const q = searchParams.get('q') || '';
  const orderBy = searchParams.get('order_by') || '';

  const sort: SortState | null = orderBy
    ? { key: orderBy.replace(/^-/, ''), dir: orderBy.startsWith('-') ? 'desc' : 'asc' }
    : null;

  const patchParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === '') next.delete(k);
        else next.set(k, v);
      });
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { items, metadata } = await getUsers({
        page,
        limit,
        username: q || undefined,
        orderBy: orderBy || undefined,
      });
      setItems(items);
      setMetadata(metadata);
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, q, orderBy]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openEdit = (user: IUser) => {
    setActiveUser(user);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };
  const openCreate = () => {
    setActiveUser(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const fmtDate = (v?: string) => (v ? new Date(v).toLocaleDateString() : t('administration.usersPage.never'));

  const columns: DataTableColumn<IUser>[] = [
    {
      id: 'username',
      header: t('administration.usersPage.username'),
      sortKey: 'username',
      hideable: false,
      cell: (u) => (
        <span className={u.is_superuser ? 'font-semibold text-secondary dark:text-secondaryLight' : 'font-medium'}>
          {u.username}
        </span>
      ),
    },
    { id: 'name', header: t('administration.usersPage.name'), sortKey: 'name', cell: (u) => u.name || '—' },
    { id: 'surname', header: t('administration.usersPage.surname'), sortKey: 'surname', cell: (u) => u.surname || '—' },
    {
      id: 'role',
      header: t('administration.usersPage.role'),
      cell: (u) =>
        u.is_superuser ? (
          <StatusChip variant="info">{t('administration.usersPage.admin')}</StatusChip>
        ) : (
          <StatusChip variant="neutral" dot={false}>{t('administration.usersPage.student')}</StatusChip>
        ),
    },
    {
      id: 'is_active',
      header: t('administration.usersPage.isActive'),
      cell: (u) =>
        u.is_active ? (
          <StatusChip variant="success">{t('administration.usersPage.active')}</StatusChip>
        ) : (
          <StatusChip variant="danger">{t('administration.usersPage.inactive')}</StatusChip>
        ),
    },
    {
      id: 'last_login',
      header: t('administration.usersPage.lastLogin'),
      sortKey: 'last_login',
      defaultHidden: true,
      cell: (u) => fmtDate(u.last_login),
    },
    {
      id: 'created_at',
      header: t('administration.usersPage.createdAt'),
      sortKey: 'created_at',
      defaultHidden: true,
      cell: (u) => fmtDate(u.created_at),
    },
  ];

  return (
    <div className="pb-10">
      <PageHeader
        title={t('administration.usersPage.title')}
        description={t('administration.usersPage.description')}
        actions={
          <Button onClick={openCreate} className="flex items-center gap-2">
            <FiPlus size={16} />
            {t('administration.usersPage.addUser')}
          </Button>
        }
      />

      <DataTable<IUser>
        caption={t('administration.usersPage.tableTitle', { x: metadata.total })}
        columns={columns}
        rows={items}
        getRowId={(u) => u.id}
        onRowClick={openEdit}
        loading={loading}
        error={error ? t('administration.usersPage.loadError') : undefined}
        onRetry={fetchUsers}
        emptyTitle={t('administration.usersPage.empty')}
        emptyDescription={t('administration.usersPage.emptyHint')}
        sort={sort}
        onSortChange={(s) => patchParams({ order_by: s.dir === 'desc' ? `-${s.key}` : s.key, page: '1' })}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit}
        onPageChange={(p) => patchParams({ page: String(p) })}
        onPageSizeChange={(n) => patchParams({ limit: String(n), page: '1' })}
        storageKey="admin-users"
        toolbar={
          <SearchField
            value={q}
            onChange={(v) => patchParams({ q: v || null, page: '1' })}
            label={t('administration.usersPage.searchPlaceholder')}
            placeholder={t('administration.usersPage.searchPlaceholder')}
            className="max-w-sm"
          />
        }
      />

      <UserDrawer
        open={drawerOpen}
        user={activeUser}
        mode={drawerMode}
        onClose={() => setDrawerOpen(false)}
        onSaved={fetchUsers}
      />
    </div>
  );
};

export default AdminUsers;
