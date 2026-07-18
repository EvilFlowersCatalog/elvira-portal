import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FiTrash2, FiX } from 'react-icons/fi';
import Drawer from '../Drawer';
import ConfirmDialog from '../ConfirmDialog';
import { Field, TextInput, Switch } from '../Field';
import UserPicker from '../UserPicker';
import Select from '../../primitives/Select';
import Tooltip from '../../primitives/Tooltip';
import Button from '../../buttons/Button';
import { ICatalog, CatalogAccessMode, ICatalogPayload } from '../../../utils/interfaces/catalog';
import { IUser } from '../../../utils/interfaces/user';
import {
  useGetCatalogDetail,
  useCreateCatalog,
  useUpdateCatalog,
  useDeleteCatalog,
} from '../../../hooks/api/catalogs/useAdminCatalogs';

interface Member {
  id: string;
  username: string;
  label: string;
  mode: CatalogAccessMode;
}

interface CatalogDrawerProps {
  open: boolean;
  catalog: ICatalog | null;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSaved: () => void;
}

export default function CatalogDrawer({ open, catalog, mode, onClose, onSaved }: CatalogDrawerProps) {
  const { t } = useTranslation();
  const getDetail = useGetCatalogDetail();
  const createCatalog = useCreateCatalog();
  const updateCatalog = useUpdateCatalog();
  const deleteCatalog = useDeleteCatalog();

  const [title, setTitle] = useState('');
  const [urlName, setUrlName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberFilter, setMemberFilter] = useState('');
  // Track load/dirty separately so we never wipe a 100+ member list by mistake:
  // membership is only sent to the API when it loaded AND the admin changed it.
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [membersDirty, setMembersDirty] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; urlName?: string }>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setMemberFilter('');
    setMembersDirty(false);
    if (mode === 'edit' && catalog) {
      setTitle(catalog.title);
      setUrlName(catalog.url_name);
      setIsPublic(catalog.is_public);
      setMembers([]);
      setMembersLoaded(false);
      getDetail(catalog.id)
        .then((full) => {
          setMembers(
            (full.user_catalogs ?? []).map((uc) => ({
              id: uc.user.id,
              username: uc.user.username,
              label: `${uc.user.name ?? ''} ${uc.user.surname ?? ''}`.trim(),
              mode: uc.mode,
            }))
          );
          setMembersLoaded(true);
        })
        .catch(() => setMembersLoaded(false));
    } else {
      setTitle('');
      setUrlName('');
      setIsPublic(false);
      setMembers([]);
      setMembersLoaded(true); // fresh catalog: empty set is authoritative
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, catalog]);

  const addMember = (u: IUser) => {
    setMembers((prev) =>
      prev.some((m) => m.id === u.id)
        ? prev
        : [...prev, { id: u.id, username: u.username, label: `${u.name ?? ''} ${u.surname ?? ''}`.trim(), mode: 'read' }]
    );
    setMembersDirty(true);
  };
  const setMemberMode = (id: string, m: CatalogAccessMode) => {
    setMembers((prev) => prev.map((mem) => (mem.id === id ? { ...mem, mode: m } : mem)));
    setMembersDirty(true);
  };
  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setMembersDirty(true);
  };

  const filteredMembers = useMemo(() => {
    const f = memberFilter.trim().toLowerCase();
    if (!f) return members;
    return members.filter((m) => m.username.toLowerCase().includes(f) || m.label.toLowerCase().includes(f));
  }, [members, memberFilter]);

  const validate = () => {
    const e: typeof errors = {};
    if (!title.trim()) e.title = t('administration.catalogsPage.titleRequired');
    if (!urlName.trim()) e.urlName = t('administration.catalogsPage.urlNameRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: ICatalogPayload = { title: title.trim(), url_name: urlName.trim(), is_public: isPublic };
      // Only include membership when it is authoritative (loaded) and changed.
      // Omitting `users` on a PUT preserves the existing membership server-side.
      if (mode === 'create' || (membersLoaded && membersDirty)) {
        payload.users = members.map((m) => ({ user_id: m.id, mode: m.mode }));
      }
      if (mode === 'create') {
        await createCatalog(payload);
        toast.success(t('administration.catalogsPage.created'));
      } else if (catalog) {
        await updateCatalog(catalog.id, payload);
        toast.success(t('administration.catalogsPage.saved'));
      }
      onSaved();
      onClose();
    } catch {
      toast.error(t('administration.catalogsPage.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!catalog) return;
    setDeleting(true);
    try {
      await deleteCatalog(catalog.id);
      toast.success(t('administration.catalogsPage.deleted'));
      setConfirmDelete(false);
      onSaved();
      onClose();
    } catch {
      toast.error(t('administration.catalogsPage.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const membershipLoading = mode === 'edit' && !membersLoaded;

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        width="max-w-lg"
        title={mode === 'create' ? t('administration.catalogsPage.createTitle') : t('administration.catalogsPage.editTitle')}
        description={mode === 'edit' && catalog ? catalog.url_name : undefined}
        footer={
          <>
            {mode === 'edit' && catalog && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mr-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-redText dark:text-red hover:bg-red/10"
              >
                <FiTrash2 size={15} />
                {t('administration.catalogsPage.delete')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {t('administration.catalogsPage.cancel')}
            </button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? '…' : mode === 'create' ? t('administration.catalogsPage.create') : t('administration.catalogsPage.save')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label={t('administration.catalogsPage.titleCol')} htmlFor="cat-title" required error={errors.title}>
            <TextInput id="cat-title" value={title} invalid={!!errors.title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <Field
            label={t('administration.catalogsPage.urlName')}
            htmlFor="cat-url"
            required
            hint={t('administration.catalogsPage.urlNameHint')}
            error={errors.urlName}
          >
            <TextInput id="cat-url" value={urlName} invalid={!!errors.urlName} onChange={(e) => setUrlName(e.target.value)} />
          </Field>

          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
            <Switch checked={isPublic} onChange={setIsPublic} label={t('administration.catalogsPage.isPublic')} />
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{t('administration.catalogsPage.isPublicHint')}</p>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {t('administration.catalogsPage.accessTitle')}
                {membersLoaded && members.length > 0 && (
                  <span className="ml-1.5 font-normal text-zinc-400">({members.length})</span>
                )}
              </h3>
            </div>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{t('administration.catalogsPage.accessHint')}</p>

            {membershipLoading ? (
              <div className="flex flex-col gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-9 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-700/50" />
                ))}
              </div>
            ) : (
              <>
                <UserPicker
                  onSelect={addMember}
                  exclude={members.map((m) => m.id)}
                  label={t('administration.catalogsPage.addMember')}
                  placeholder={t('administration.catalogsPage.addMember')}
                />

                {members.length > 8 && (
                  <input
                    aria-label={t('administration.catalogsPage.filterMembers')}
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                    placeholder={t('administration.catalogsPage.filterMembers')}
                    className="mt-2 h-9 w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40 px-3 text-sm outline-none focus:border-primary"
                  />
                )}

                <div className="mt-2 flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
                  {members.length === 0 ? (
                    <p className="text-sm text-zinc-400">{t('administration.catalogsPage.noMembers')}</p>
                  ) : filteredMembers.length === 0 ? (
                    <p className="text-sm text-zinc-400">{t('administration.catalogsPage.noMemberMatch')}</p>
                  ) : (
                    filteredMembers.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{m.username}</p>
                          {m.label && <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{m.label}</p>}
                        </div>
                        <Select
                          aria-label={`${m.username} access mode`}
                          value={m.mode}
                          onChange={(value) => setMemberMode(m.id, value as CatalogAccessMode)}
                          options={[
                            { value: 'read', label: t('administration.catalogsPage.modeRead') },
                            { value: 'manage', label: t('administration.catalogsPage.modeManage') },
                          ]}
                          className="w-36 shrink-0"
                          triggerClassName="rounded-md border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1"
                        />
                        <Tooltip content={`${t('administration.catalogsPage.remove')} ${m.username}`}>
                          <button
                            type="button"
                            aria-label={`${t('administration.catalogsPage.remove')} ${m.username}`}
                            onClick={() => removeMember(m.id)}
                            className="text-zinc-400 hover:text-redText dark:hover:text-red"
                          >
                            <FiX size={16} />
                          </button>
                        </Tooltip>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        title={t('administration.catalogsPage.deleteConfirmTitle')}
        message={t('administration.catalogsPage.deleteConfirmBody', { name: catalog?.title ?? '' })}
        confirmLabel={t('administration.catalogsPage.delete')}
        cancelLabel={t('administration.catalogsPage.cancel')}
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
