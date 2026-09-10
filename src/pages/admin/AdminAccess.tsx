import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiCopy, FiEye, FiEyeOff, FiTrash2 } from 'react-icons/fi';
import { Metadata } from '../../utils/interfaces/general/general';
import { IUser } from '../../utils/interfaces/user';
import useGetUsers from '../../hooks/api/users/useGetUsers';
import {
  useListApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
  IApiKey,
} from '../../hooks/api/access/useAdminApiKeys';
import {
  useListAccessGrants,
  useRevokeAccessGrant,
  IAccessGrant,
} from '../../hooks/api/access/useAdminAccessGrants';
import {
  PageHeader,
  DataTable,
  DataTableColumn,
  StatusChip,
  SearchField,
  ConfirmDialog,
  Drawer,
  Field,
  TextInput,
  Switch,
  IconButton,
  UserPicker,
} from '../../components/admin';
import Button from '../../components/buttons/Button';

const LIMIT = 25;

// ---------- Create API key drawer ----------
function CreateKeyDrawer({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const createKey = useCreateApiKey();
  const [name, setName] = useState('');
  const [owner, setOwner] = useState<IUser | null>(null);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setOwner(null);
      setActive(true);
    }
  }, [open]);

  const submit = async () => {
    setSaving(true);
    try {
      await createKey({ name: name.trim() || undefined, user_id: owner?.id, is_active: active });
      toast.success(t('administration.accessPage.keys.created'));
      onSaved();
      onClose();
    } catch {
      toast.error(t('administration.accessPage.keys.createError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('administration.accessPage.keys.createTitle')}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            {t('administration.accessPage.keys.cancel')}
          </button>
          <Button type="button" onClick={submit} disabled={saving}>
            {saving ? '…' : t('administration.accessPage.keys.create')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={t('administration.accessPage.keys.nameLabel')} htmlFor="key-name">
          <TextInput id="key-name" value={name} placeholder={t('administration.accessPage.keys.namePlaceholder')} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div>
          <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">{t('administration.accessPage.keys.ownerLabel')}</p>
          {owner ? (
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5">
              <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-100">{owner.username}</span>
              <button type="button" onClick={() => setOwner(null)} className="text-zinc-400 hover:text-redText dark:hover:text-red text-sm">
                ✕
              </button>
            </div>
          ) : (
            <UserPicker onSelect={setOwner} label={t('administration.accessPage.keys.ownerLabel')} placeholder={t('administration.accessPage.keys.ownerLabel')} />
          )}
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t('administration.accessPage.keys.ownerHint')}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
          <Switch checked={active} onChange={setActive} label={t('administration.accessPage.keys.activeToggle')} />
        </div>
      </div>
    </Drawer>
  );
}

// ---------- Token cell ----------
function TokenCell({ token }: { token: string }) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  const masked = `${token.slice(0, 6)}••••••••${token.slice(-4)}`;
  return (
    <div className="flex items-center gap-1.5">
      <code className="max-w-[220px] truncate text-xs text-zinc-500 dark:text-zinc-400">{revealed ? token : masked}</code>
      <IconButton label={revealed ? t('administration.accessPage.keys.hide') : t('administration.accessPage.keys.reveal')} variant="ghost" size="sm" onClick={() => setRevealed((r) => !r)}>
        {revealed ? <FiEyeOff size={14} /> : <FiEye size={14} />}
      </IconButton>
      <IconButton
        label={t('administration.accessPage.keys.copy')}
        variant="ghost"
        size="sm"
        onClick={() => {
          navigator.clipboard?.writeText(token);
          toast.success(t('administration.accessPage.keys.copied'));
        }}
      >
        <FiCopy size={14} />
      </IconButton>
    </div>
  );
}

const AdminAccess = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'grants' ? 'grants' : 'keys';

  const listKeys = useListApiKeys();
  const deleteKey = useDeleteApiKey();
  const listGrants = useListAccessGrants();
  const revokeGrant = useRevokeAccessGrant();
  const getUsers = useGetUsers();

  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  // keys
  const [keys, setKeys] = useState<IApiKey[]>([]);
  const [keysMeta, setKeysMeta] = useState<Metadata>({ page: 1, limit: LIMIT, pages: 1, total: 0 });
  const [keysLoading, setKeysLoading] = useState(true);
  const [keysError, setKeysError] = useState(false);
  const [pendingDeleteKey, setPendingDeleteKey] = useState<IApiKey | null>(null);

  // grants
  const [grants, setGrants] = useState<IAccessGrant[]>([]);
  const [grantsMeta, setGrantsMeta] = useState<Metadata>({ page: 1, limit: LIMIT, pages: 1, total: 0 });
  const [grantsLoading, setGrantsLoading] = useState(true);
  const [grantsError, setGrantsError] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<IAccessGrant | null>(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const q = searchParams.get('q') || '';

  const patchParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    getUsers({})
      .then(({ items }) => {
        const map: Record<string, string> = {};
        items.forEach((u) => (map[u.id] = u.username));
        setUserMap(map);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchKeys = useCallback(async () => {
    setKeysLoading(true);
    setKeysError(false);
    try {
      const { items, metadata } = await listKeys({ page, limit: LIMIT, name: q || undefined });
      setKeys(items);
      setKeysMeta(metadata);
    } catch {
      setKeysError(true);
      setKeys([]);
    } finally {
      setKeysLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q]);

  const fetchGrants = useCallback(async () => {
    setGrantsLoading(true);
    setGrantsError(false);
    try {
      const { items, metadata } = await listGrants({ page, limit: LIMIT });
      setGrants(items);
      setGrantsMeta(metadata);
    } catch {
      setGrantsError(true);
      setGrants([]);
    } finally {
      setGrantsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (tab === 'keys') fetchKeys();
    else fetchGrants();
  }, [tab, fetchKeys, fetchGrants]);

  const fmt = (v?: string | null) => (v ? new Date(v).toLocaleDateString() : null);

  const keyColumns: DataTableColumn<IApiKey>[] = [
    { id: 'name', header: t('administration.accessPage.keys.name'), hideable: false, cell: (k) => <span className="font-medium text-secondary dark:text-secondaryLight">{k.name || '—'}</span> },
    { id: 'owner', header: t('administration.accessPage.keys.owner'), cell: (k) => userMap[k.user_id] ?? '…' },
    {
      id: 'active',
      header: t('administration.accessPage.keys.active'),
      cell: (k) => (k.is_active ? <StatusChip variant="success">{t('administration.accessPage.keys.active')}</StatusChip> : <StatusChip variant="neutral">{t('administration.accessPage.keys.inactive')}</StatusChip>),
    },
    { id: 'last_seen', header: t('administration.accessPage.keys.lastSeen'), cell: (k) => fmt(k.last_seen_at) ?? t('administration.accessPage.keys.never') },
    { id: 'token', header: t('administration.accessPage.keys.token'), hideable: true, cell: (k) => <TokenCell token={k.token} /> },
    {
      id: 'actions',
      header: '',
      align: 'right',
      hideable: false,
      cell: (k) => (
        <IconButton label={t('administration.accessPage.keys.delete')} variant="danger" size="sm" onClick={() => setPendingDeleteKey(k)}>
          <FiTrash2 size={15} />
        </IconButton>
      ),
    },
  ];

  const grantColumns: DataTableColumn<IAccessGrant>[] = [
    { id: 'user', header: t('administration.accessPage.grants.user'), hideable: false, cell: (g) => <span className="font-medium">{g.user?.username ?? '—'}</span> },
    { id: 'entry', header: t('administration.accessPage.grants.entry'), cell: (g) => <span className="text-secondary dark:text-secondaryLight">{g.entry?.title ?? '—'}</span> },
    { id: 'type', header: t('administration.accessPage.grants.type'), cell: (g) => <StatusChip variant="info" dot={false}>{g.type}</StatusChip> },
    { id: 'expires', header: t('administration.accessPage.grants.expires'), cell: (g) => fmt(g.expire_at) ?? t('administration.accessPage.grants.noExpiry') },
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

  // client-side username filter for grants
  const visibleGrants = q ? grants.filter((g) => g.user?.username?.toLowerCase().includes(q.toLowerCase())) : grants;

  const TabButton = ({ id, label }: { id: string; label: string }) => (
    <button
      onClick={() => patchParams({ tab: id === 'keys' ? null : id, page: null, q: null })}
      aria-current={tab === id ? 'page' : undefined}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        tab === id ? 'bg-primaryLight text-primaryText dark:bg-primaryDark dark:text-primaryLight' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="pb-10">
      <PageHeader
        title={t('administration.accessPage.title')}
        description={t('administration.accessPage.description')}
        actions={
          tab === 'keys' ? (
            <Button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2">
              <FiPlus size={16} />
              {t('administration.accessPage.keys.add')}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-1 flex gap-2 px-5">
        <TabButton id="keys" label={t('administration.accessPage.tabKeys')} />
        <TabButton id="grants" label={t('administration.accessPage.tabGrants')} />
      </div>

      {tab === 'keys' ? (
        <DataTable<IApiKey>
          caption={t('administration.accessPage.tabKeys')}
          columns={keyColumns}
          rows={keys}
          getRowId={(k) => k.id}
          loading={keysLoading}
          error={keysError ? t('administration.accessPage.keys.loadError') : undefined}
          onRetry={fetchKeys}
          emptyTitle={t('administration.accessPage.keys.empty')}
          emptyDescription={t('administration.accessPage.keys.emptyHint')}
          page={keysMeta.page}
          pageCount={keysMeta.pages}
          total={keysMeta.total}
          pageSize={keysMeta.limit}
          onPageChange={(p) => patchParams({ page: String(p) })}
          storageKey="admin-api-keys"
          toolbar={
            <SearchField value={q} onChange={(v) => patchParams({ q: v || null, page: '1' })} label={t('administration.accessPage.keys.searchPlaceholder')} placeholder={t('administration.accessPage.keys.searchPlaceholder')} className="max-w-sm" />
          }
        />
      ) : (
        <DataTable<IAccessGrant>
          caption={t('administration.accessPage.tabGrants')}
          columns={grantColumns}
          rows={visibleGrants}
          getRowId={(g) => g.id}
          loading={grantsLoading}
          error={grantsError ? t('administration.accessPage.grants.loadError') : undefined}
          onRetry={fetchGrants}
          emptyTitle={t('administration.accessPage.grants.empty')}
          emptyDescription={t('administration.accessPage.grants.emptyHint')}
          page={grantsMeta.page}
          pageCount={grantsMeta.pages}
          total={grantsMeta.total}
          pageSize={grantsMeta.limit}
          onPageChange={(p) => patchParams({ page: String(p) })}
          storageKey="admin-grants"
          toolbar={
            <SearchField value={q} onChange={(v) => patchParams({ q: v || null })} label={t('administration.accessPage.grants.searchPlaceholder')} placeholder={t('administration.accessPage.grants.searchPlaceholder')} className="max-w-sm" />
          }
        />
      )}

      <CreateKeyDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSaved={fetchKeys} />

      <ConfirmDialog
        open={pendingDeleteKey !== null}
        title={t('administration.accessPage.keys.deleteConfirmTitle')}
        message={t('administration.accessPage.keys.deleteConfirmBody', { name: pendingDeleteKey?.name || '' })}
        confirmLabel={t('administration.accessPage.keys.delete')}
        cancelLabel={t('administration.accessPage.keys.cancel')}
        destructive
        onConfirm={async () => {
          if (pendingDeleteKey) {
            try {
              await deleteKey(pendingDeleteKey.id);
              toast.success(t('administration.accessPage.keys.deleted'));
              fetchKeys();
            } catch {
              toast.error(t('administration.accessPage.keys.deleteError'));
            }
          }
          setPendingDeleteKey(null);
        }}
        onCancel={() => setPendingDeleteKey(null)}
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
    </div>
  );
};

export default AdminAccess;
