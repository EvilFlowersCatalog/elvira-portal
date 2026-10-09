import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import useGetUsers from '../../hooks/api/users/useGetUsers';
import { useListCatalogs } from '../../hooks/api/catalogs/useAdminCatalogs';
import useTableParams from '../../hooks/useTableParams';
import { IUser } from '../../utils/interfaces/user';
import { ICatalog } from '../../utils/interfaces/catalog';
import { Metadata, NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { fmtDate } from '../../utils/func/adminDate';
import { PageHeader, DataTable, DataTableColumn, StatusChip, SearchField } from '../../components/admin';
import Select from '../../components/primitives/Select';
import Button from '../../components/buttons/Button';
import UserDrawer from '../../components/admin/users/UserDrawer';

const DEFAULT_LIMIT = 10;
const FILTER_TRIGGER = 'h-11 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm';

const AdminUsers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const getUsers = useGetUsers();
  const listCatalogs = useListCatalogs();
  const { searchParams, page, limit, q, orderBy, patch, setQuery, tableProps } = useTableParams({ limit: DEFAULT_LIMIT });

  const [items, setItems] = useState<IUser[]>([]);
  const [metadata, setMetadata] = useState<Metadata>({ page: 1, limit: DEFAULT_LIMIT, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [catalogs, setCatalogs] = useState<ICatalog[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters live in the URL next to search/sort/page (shareable, back-button friendly).
  const role = searchParams.get('role') || '';
  const status = searchParams.get('status') || '';
  const catalogId = searchParams.get('catalog') || '';

  useEffect(() => {
    listCatalogs({ orderBy: 'title' })
      .then(({ items }) => setCatalogs(items))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { items, metadata } = await getUsers({
        page,
        limit,
        query: q || undefined,
        is_superuser: role ? role === 'admin' : undefined,
        is_active: status ? status === 'active' : undefined,
        catalog_id: catalogId || undefined,
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
  }, [page, limit, q, orderBy, role, status, catalogId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openProfile = (user: IUser) => navigate(`${NAVIGATION_PATHS.adminUsers}/${user.id}`);


  const columns: DataTableColumn<IUser>[] = [
    {
      id: 'username',
      header: t('administration.usersPage.username'),
      sortKey: 'username',
      hideable: false,
      cell: (u) => <span className="font-medium text-secondary dark:text-secondaryLight">{u.username}</span>,
    },
    { id: 'name', header: t('administration.usersPage.name'), sortKey: 'name', cell: (u) => u.name || '—' },
    { id: 'surname', header: t('administration.usersPage.surname'), sortKey: 'surname', cell: (u) => u.surname || '—' },
    {
      id: 'role',
      header: t('administration.usersPage.role'),
      sortKey: 'is_superuser',
      cell: (u) =>
        u.is_superuser ? (
          <StatusChip variant="info">{t('administration.usersPage.admin')}</StatusChip>
        ) : (
          <StatusChip variant="neutral" dot={false}>{t('administration.usersPage.student')}</StatusChip>
        ),
    },
    {
      id: 'is_active',
      header: t('administration.usersPage.status'),
      sortKey: 'is_active',
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
      cell: (u) => fmtDate(u.last_login) ?? t('administration.usersPage.never'),
    },
    {
      id: 'created_at',
      header: t('administration.usersPage.createdAt'),
      sortKey: 'created_at',
      defaultHidden: true,
      cell: (u) => fmtDate(u.created_at) ?? '—',
    },
  ];

  return (
    <div className="pb-10">
      <PageHeader
        title={t('administration.usersPage.title')}
        description={t('administration.usersPage.description')}
        actions={
          <Button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2">
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
        onRowClick={openProfile}
        loading={loading}
        error={error ? t('administration.usersPage.loadError') : undefined}
        onRetry={fetchUsers}
        emptyTitle={t('administration.usersPage.empty')}
        emptyDescription={t('administration.usersPage.emptyHint')}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit}
        {...tableProps}
        storageKey="admin-users-v2"
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <SearchField
              value={q}
              onChange={setQuery}
              label={t('administration.usersPage.searchPlaceholder')}
              placeholder={t('administration.usersPage.searchPlaceholder')}
              className="w-full max-w-sm"
            />
            <Select
              aria-label={t('administration.usersPage.role')}
              value={role}
              onChange={(v) => patch({ role: v || null, page: null })}
              options={[
                { value: '', label: t('administration.usersPage.filterAllRoles') },
                { value: 'admin', label: t('administration.usersPage.admin') },
                { value: 'user', label: t('administration.usersPage.student') },
              ]}
              className="w-44"
              triggerClassName={FILTER_TRIGGER}
            />
            <Select
              aria-label={t('administration.usersPage.status')}
              value={status}
              onChange={(v) => patch({ status: v || null, page: null })}
              options={[
                { value: '', label: t('administration.usersPage.filterAllStatuses') },
                { value: 'active', label: t('administration.usersPage.active') },
                { value: 'inactive', label: t('administration.usersPage.inactive') },
              ]}
              className="w-44"
              triggerClassName={FILTER_TRIGGER}
            />
            <Select
              aria-label={t('administration.nav.catalogs')}
              value={catalogId}
              onChange={(v) => patch({ catalog: v || null, page: null })}
              options={[
                { value: '', label: t('administration.usersPage.filterAllCatalogs') },
                ...catalogs.map((c) => ({ value: c.id, label: c.title })),
              ]}
              className="w-52"
              triggerClassName={FILTER_TRIGGER}
            />
          </div>
        }
      />

      <UserDrawer
        open={drawerOpen}
        user={null}
        mode="create"
        onClose={() => setDrawerOpen(false)}
        // Land on the new profile: catalogs, loans and the rest are one click away.
        onSaved={(created) => (created ? openProfile(created) : fetchUsers())}
      />
    </div>
  );
};

export default AdminUsers;
