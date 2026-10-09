import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { ICatalog, CatalogAccessMode } from '../../../utils/interfaces/catalog';
import { IUser } from '../../../utils/interfaces/user';
import { useListCatalogs } from '../../../hooks/api/catalogs/useAdminCatalogs';
import useUserCatalogMembership from '../../../hooks/api/users/useUserCatalogMembership';
import DataTable, { DataTableColumn } from '../DataTable';
import StatusChip from '../StatusChip';
import IconButton from '../IconButton';
import ConfirmDialog from '../ConfirmDialog';
import Select from '../../primitives/Select';
import Button from '../../buttons/Button';

interface Row {
  catalog: ICatalog;
  mode: CatalogAccessMode;
}

interface UserCatalogsPanelProps {
  user: IUser;
  /** Called after membership changed so the profile can reload the user. */
  onChanged: () => void;
}

/** Which catalogs a user can enter, and with what rights — edited from the user's side. */
export default function UserCatalogsPanel({ user, onChanged }: UserCatalogsPanelProps) {
  const { t } = useTranslation();
  const listCatalogs = useListCatalogs();
  const setMembership = useUserCatalogMembership();

  const [catalogs, setCatalogs] = useState<ICatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [addCatalogId, setAddCatalogId] = useState('');
  const [addMode, setAddMode] = useState<CatalogAccessMode>('read');
  const [pendingRemove, setPendingRemove] = useState<Row | null>(null);

  const loadCatalogs = () => {
    setLoading(true);
    setError(false);
    listCatalogs({ orderBy: 'title' })
      .then(({ items }) => setCatalogs(items))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCatalogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const memberships = useMemo(() => user.catalog_permissions ?? {}, [user.catalog_permissions]);
  const rows: Row[] = useMemo(
    () => catalogs.filter((c) => memberships[c.id]).map((c) => ({ catalog: c, mode: memberships[c.id] as CatalogAccessMode })),
    [catalogs, memberships]
  );
  const available = catalogs.filter((c) => !memberships[c.id]);

  const modeOptions = [
    { value: 'read', label: t('administration.catalogsPage.modeRead') },
    { value: 'write', label: t('administration.catalogsPage.modeWrite') },
    { value: 'manage', label: t('administration.catalogsPage.modeManage') },
  ];

  const change = async (catalogId: string, mode: CatalogAccessMode | null, successKey: string) => {
    setBusy(true);
    try {
      await setMembership(user.id, catalogId, mode);
      toast.success(t(successKey));
      onChanged();
    } catch {
      toast.error(t('administration.userProfile.catalogs.error'));
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    if (!addCatalogId) return;
    await change(addCatalogId, addMode, 'administration.userProfile.catalogs.added');
    setAddCatalogId('');
    setAddMode('read');
  };

  const columns: DataTableColumn<Row>[] = [
    {
      id: 'title',
      header: t('administration.catalogsPage.titleCol'),
      hideable: false,
      cell: (r) => <span className="font-medium text-secondary dark:text-secondaryLight">{r.catalog.title}</span>,
    },
    {
      id: 'url_name',
      header: t('administration.catalogsPage.urlName'),
      cell: (r) => <code className="text-xs text-zinc-500 dark:text-zinc-400">{r.catalog.url_name}</code>,
    },
    {
      id: 'visibility',
      header: t('administration.catalogsPage.visibility'),
      cell: (r) =>
        r.catalog.is_public ? (
          <StatusChip variant="success">{t('administration.catalogsPage.public')}</StatusChip>
        ) : (
          <StatusChip variant="neutral">{t('administration.catalogsPage.private')}</StatusChip>
        ),
    },
    {
      id: 'mode',
      header: t('administration.userProfile.catalogs.mode'),
      hideable: false,
      cell: (r) => (
        <Select
          aria-label={`${r.catalog.title} — ${t('administration.userProfile.catalogs.mode')}`}
          value={r.mode}
          disabled={busy}
          onChange={(value) => value !== r.mode && change(r.catalog.id, value as CatalogAccessMode, 'administration.userProfile.catalogs.updated')}
          options={modeOptions}
          className="w-40"
          triggerClassName="py-1"
        />
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      hideable: false,
      cell: (r) => (
        <IconButton label={t('administration.userProfile.catalogs.remove')} variant="danger" size="sm" disabled={busy} onClick={() => setPendingRemove(r)}>
          <FiTrash2 size={15} />
        </IconButton>
      ),
    },
  ];

  return (
    <>
      {user.is_superuser && (
        <p className="mx-5 mb-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300">
          {t('administration.userProfile.catalogs.adminNote')}
        </p>
      )}

      <DataTable<Row>
        caption={t('administration.userProfile.tabs.catalogs')}
        columns={columns}
        rows={rows}
        getRowId={(r) => r.catalog.id}
        loading={loading}
        error={error ? t('administration.catalogsPage.loadError') : undefined}
        onRetry={loadCatalogs}
        emptyTitle={t('administration.userProfile.catalogs.empty')}
        emptyDescription={t('administration.userProfile.catalogs.emptyHint')}
        storageKey="admin-user-catalogs"
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              aria-label={t('administration.userProfile.catalogs.pick')}
              value={addCatalogId}
              onChange={setAddCatalogId}
              placeholder={
                available.length === 0 && !loading
                  ? t('administration.userProfile.catalogs.allAssigned')
                  : t('administration.userProfile.catalogs.pick')
              }
              disabled={busy || available.length === 0}
              options={available.map((c) => ({ value: c.id, label: c.title }))}
              className="w-64"
              triggerClassName="h-11 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm"
            />
            <Select
              aria-label={t('administration.userProfile.catalogs.mode')}
              value={addMode}
              onChange={(v) => setAddMode(v as CatalogAccessMode)}
              disabled={busy || available.length === 0}
              options={modeOptions}
              className="w-44"
              triggerClassName="h-11 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm"
            />
            <Button onClick={add} disabled={busy || !addCatalogId} className="flex h-11 items-center gap-2 disabled:opacity-50">
              <FiPlus size={16} />
              {t('administration.userProfile.catalogs.add')}
            </Button>
          </div>
        }
      />

      <ConfirmDialog
        open={pendingRemove !== null}
        title={t('administration.userProfile.catalogs.removeConfirmTitle')}
        message={t('administration.userProfile.catalogs.removeConfirmBody', {
          user: user.username,
          catalog: pendingRemove?.catalog.title ?? '',
        })}
        confirmLabel={t('administration.userProfile.catalogs.remove')}
        cancelLabel={t('administration.usersPage.cancel')}
        destructive
        loading={busy}
        onConfirm={async () => {
          if (pendingRemove) await change(pendingRemove.catalog.id, null, 'administration.userProfile.catalogs.removed');
          setPendingRemove(null);
        }}
        onCancel={() => setPendingRemove(null)}
      />
    </>
  );
}
