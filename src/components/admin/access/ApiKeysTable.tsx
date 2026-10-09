import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FiCopy, FiEye, FiEyeOff, FiTrash2 } from 'react-icons/fi';
import { Metadata } from '../../../utils/interfaces/general/general';
import { IUser } from '../../../utils/interfaces/user';
import { useListApiKeys, useCreateApiKey, useDeleteApiKey, IApiKey } from '../../../hooks/api/access/useAdminApiKeys';
import useUserLookup from '../../../hooks/api/users/useUserLookup';
import useTableParams from '../../../hooks/useTableParams';
import { fmtDate } from '../../../utils/func/adminDate';
import DataTable, { DataTableColumn } from '../DataTable';
import StatusChip from '../StatusChip';
import SearchField from '../SearchField';
import ConfirmDialog from '../ConfirmDialog';
import Drawer from '../Drawer';
import { Field, TextInput, Switch } from '../Field';
import IconButton from '../IconButton';
import UserPicker from '../UserPicker';
import UserLink from '../UserLink';
import Button from '../../buttons/Button';

const DEFAULT_LIMIT = 25;

interface CreateKeyDrawerProps {
  open: boolean;
  /** Fixed owner (profile view); otherwise the admin picks one. */
  ownerId?: string;
  onClose: () => void;
  onSaved: () => void;
}

function CreateKeyDrawer({ open, ownerId, onClose, onSaved }: CreateKeyDrawerProps) {
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
      await createKey({ name: name.trim() || undefined, user_id: ownerId ?? owner?.id, is_active: active });
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
        {!ownerId && (
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
        )}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
          <Switch checked={active} onChange={setActive} label={t('administration.accessPage.keys.activeToggle')} />
        </div>
      </div>
    </Drawer>
  );
}

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

interface ApiKeysTableProps {
  /** Restrict to one user's keys (profile view); hides the owner column. */
  userId?: string;
  /** Controlled "create" drawer so the page header can own the button. */
  createOpen: boolean;
  onCreateClose: () => void;
  onTotal?: (total: number) => void;
}

/** API keys with create/delete. Used by the Access page and the user profile. */
export default function ApiKeysTable({ userId, createOpen, onCreateClose, onTotal }: ApiKeysTableProps) {
  const { t } = useTranslation();
  const listKeys = useListApiKeys();
  const deleteKey = useDeleteApiKey();
  const { page, limit, q, orderBy, setQuery, tableProps } = useTableParams({ limit: DEFAULT_LIMIT });

  const [keys, setKeys] = useState<IApiKey[]>([]);
  const [metadata, setMetadata] = useState<Metadata>({ page: 1, limit: DEFAULT_LIMIT, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<IApiKey | null>(null);

  const users = useUserLookup(userId ? [] : keys.map((k) => k.user_id));

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { items, metadata } = await listKeys({ page, limit, user_id: userId, name: q || undefined, orderBy: orderBy || undefined });
      setKeys(items);
      setMetadata(metadata);
      onTotal?.(metadata.total);
    } catch {
      setError(true);
      setKeys([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, q, orderBy, userId]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const fmt = fmtDate;

  const columns: DataTableColumn<IApiKey>[] = [
    {
      id: 'name',
      header: t('administration.accessPage.keys.name'),
      sortKey: 'name',
      hideable: false,
      cell: (k) => <span className="font-medium text-secondary dark:text-secondaryLight">{k.name || '—'}</span>,
    },
    ...(userId
      ? []
      : [
          {
            id: 'owner',
            header: t('administration.accessPage.keys.owner'),
            sortKey: 'user__username',
            cell: (k: IApiKey) => <UserLink id={k.user_id} user={users[k.user_id]} />,
          } as DataTableColumn<IApiKey>,
        ]),
    {
      id: 'active',
      header: t('administration.accessPage.keys.active'),
      sortKey: 'is_active',
      cell: (k) =>
        k.is_active ? (
          <StatusChip variant="success">{t('administration.accessPage.keys.active')}</StatusChip>
        ) : (
          <StatusChip variant="neutral">{t('administration.accessPage.keys.inactive')}</StatusChip>
        ),
    },
    {
      id: 'last_seen',
      header: t('administration.accessPage.keys.lastSeen'),
      sortKey: 'last_seen_at',
      cell: (k) => fmt(k.last_seen_at) ?? t('administration.accessPage.keys.never'),
    },
    {
      id: 'created_at',
      header: t('administration.accessPage.keys.createdAt'),
      sortKey: 'created_at',
      defaultHidden: true,
      cell: (k) => fmt(k.created_at) ?? '—',
    },
    { id: 'token', header: t('administration.accessPage.keys.token'), cell: (k) => <TokenCell token={k.token} /> },
    {
      id: 'actions',
      header: '',
      align: 'right',
      hideable: false,
      cell: (k) => (
        <IconButton label={t('administration.accessPage.keys.delete')} variant="danger" size="sm" onClick={() => setPendingDelete(k)}>
          <FiTrash2 size={15} />
        </IconButton>
      ),
    },
  ];

  return (
    <>
      <DataTable<IApiKey>
        caption={t('administration.accessPage.tabKeys')}
        columns={columns}
        rows={keys}
        getRowId={(k) => k.id}
        loading={loading}
        error={error ? t('administration.accessPage.keys.loadError') : undefined}
        onRetry={fetchKeys}
        emptyTitle={t('administration.accessPage.keys.empty')}
        emptyDescription={t('administration.accessPage.keys.emptyHint')}
        page={metadata.page}
        pageCount={metadata.pages}
        total={metadata.total}
        pageSize={metadata.limit}
        {...tableProps}
        storageKey={userId ? 'admin-user-api-keys' : 'admin-api-keys'}
        toolbar={
          <SearchField
            value={q}
            onChange={setQuery}
            label={t('administration.accessPage.keys.searchPlaceholder')}
            placeholder={t('administration.accessPage.keys.searchPlaceholder')}
            className="max-w-sm"
          />
        }
      />

      <CreateKeyDrawer open={createOpen} ownerId={userId} onClose={onCreateClose} onSaved={fetchKeys} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t('administration.accessPage.keys.deleteConfirmTitle')}
        message={t('administration.accessPage.keys.deleteConfirmBody', { name: pendingDelete?.name || '' })}
        confirmLabel={t('administration.accessPage.keys.delete')}
        cancelLabel={t('administration.accessPage.keys.cancel')}
        destructive
        onConfirm={async () => {
          if (pendingDelete) {
            try {
              await deleteKey(pendingDelete.id);
              toast.success(t('administration.accessPage.keys.deleted'));
              fetchKeys();
            } catch {
              toast.error(t('administration.accessPage.keys.deleteError'));
            }
          }
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
