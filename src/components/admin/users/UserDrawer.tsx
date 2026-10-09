import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FiTrash2, FiX } from 'react-icons/fi';
import Drawer from '../Drawer';
import ConfirmDialog from '../ConfirmDialog';
import { Field, TextInput, Switch } from '../Field';
import Select from '../../primitives/Select';
import Button from '../../buttons/Button';
import { IUser } from '../../../utils/interfaces/user';
import { ICatalog, CatalogAccessMode } from '../../../utils/interfaces/catalog';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import useCreateUser from '../../../hooks/api/users/useCreateUser';
import useUpdateUser from '../../../hooks/api/users/useUpdateUser';
import useDeleteUser from '../../../hooks/api/users/useDeleteUser';
import useUserCatalogMembership from '../../../hooks/api/users/useUserCatalogMembership';
import { forgetUser } from '../../../hooks/api/users/useUserLookup';
import { useListCatalogs } from '../../../hooks/api/catalogs/useAdminCatalogs';

interface UserDrawerProps {
  open: boolean;
  /** null => create mode. */
  user: IUser | null;
  mode: 'create' | 'edit';
  onClose: () => void;
  /** Receives the created user so the caller can open their profile. */
  onSaved: (user?: IUser) => void;
  onDeleted?: () => void;
}

interface FormState {
  username: string;
  name: string;
  surname: string;
  password: string;
  passphrase: string;
  passphraseHint: string;
  isActive: boolean;
  isSuperuser: boolean;
}

const EMPTY: FormState = {
  username: '',
  name: '',
  surname: '',
  password: '',
  passphrase: '',
  passphraseHint: '',
  isActive: true,
  isSuperuser: false,
};

export default function UserDrawer({ open, user, mode, onClose, onSaved, onDeleted }: UserDrawerProps) {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const listCatalogs = useListCatalogs();
  const setMembership = useUserCatalogMembership();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Create mode: catalogs to grant right away, so a new account is usable in one step.
  const [catalogs, setCatalogs] = useState<ICatalog[]>([]);
  const [grants, setGrants] = useState<{ catalog: ICatalog; mode: CatalogAccessMode }[]>([]);

  const isSelf = !!user && user.id === auth?.userId;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setGrants([]);
    if (mode === 'edit' && user) {
      setForm({
        username: user.username,
        name: user.name ?? '',
        surname: user.surname ?? '',
        password: '',
        passphrase: '',
        passphraseHint: user.lcp_passphrase_hint ?? '',
        isActive: user.is_active,
        isSuperuser: user.is_superuser,
      });
    } else {
      setForm(EMPTY);
      listCatalogs({ orderBy: 'title' })
        .then(({ items }) => {
          setCatalogs(items);
          // The API does not add a hand-made account to any catalog (only LDAP
          // sign-ins get that), so start with the portal's own catalog granted.
          const current = items.find((c) => c.id === import.meta.env.ELVIRA_CATALOG_ID);
          if (current) setGrants([{ catalog: current, mode: 'read' }]);
        })
        .catch(() => setCatalogs([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, user]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = t('administration.usersPage.requiredName');
    if (!form.surname.trim()) e.surname = t('administration.usersPage.requiredSurname');
    if (mode === 'create') {
      if (!form.username.trim()) e.username = t('administration.usersPage.requiredUsername');
      if (!form.password.trim()) e.password = t('administration.usersPage.requiredPassword');
    }
    if (form.passphrase && form.passphrase.length < 4) e.passphrase = t('administration.usersPage.passphraseTooShort');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let saved: IUser | undefined;
      if (mode === 'create') {
        saved = await createUser({
          username: form.username.trim(),
          name: form.name.trim(),
          surname: form.surname.trim(),
          password: form.password,
          is_active: form.isActive,
          is_superuser: form.isSuperuser,
          ...(form.passphrase ? { lcp_passphrase: form.passphrase } : {}),
          ...(form.passphraseHint ? { lcp_passphrase_hint: form.passphraseHint } : {}),
        });
        // Sequential: each grant rewrites one catalog's member list.
        let failed = 0;
        for (const g of grants) {
          try {
            await setMembership(saved.id, g.catalog.id, g.mode);
          } catch {
            failed += 1;
          }
        }
        if (failed) toast.warning(t('administration.usersPage.catalogGrantError', { count: failed }));
        toast.success(t('administration.usersPage.created'));
      } else if (user) {
        saved = await updateUser(user.id, {
          name: form.name.trim(),
          surname: form.surname.trim(),
          is_active: form.isActive,
          // Your own role is locked; don't send it.
          ...(isSelf ? {} : { is_superuser: form.isSuperuser }),
          ...(form.password ? { password: form.password } : {}),
          ...(form.passphrase ? { lcp_passphrase: form.passphrase } : {}),
          lcp_passphrase_hint: form.passphraseHint,
        });
        forgetUser(user.id);
        toast.success(t('administration.usersPage.saved'));
      }
      // A catalog that predates role editing accepts the request but leaves the role as it was.
      if (saved && !isSelf && saved.is_superuser !== form.isSuperuser) {
        toast.warning(t('administration.usersPage.roleNotApplied'));
      }
      onSaved(saved);
      onClose();
    } catch (e: any) {
      toast.error(
        e?.response?.status === 409
          ? t('administration.usersPage.usernameTaken')
          : e?.response?.data?.title || t('administration.usersPage.saveError')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteUser(user.id);
      forgetUser(user.id);
      toast.success(t('administration.usersPage.deleted'));
      setConfirmDelete(false);
      onClose();
      (onDeleted ?? onSaved)();
    } catch {
      toast.error(t('administration.usersPage.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const modeOptions = [
    { value: 'read', label: t('administration.catalogsPage.modeRead') },
    { value: 'write', label: t('administration.catalogsPage.modeWrite') },
    { value: 'manage', label: t('administration.catalogsPage.modeManage') },
  ];
  const freeCatalogs = catalogs.filter((c) => !grants.some((g) => g.catalog.id === c.id));

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={mode === 'create' ? t('administration.usersPage.createTitle') : t('administration.usersPage.editTitle')}
        description={mode === 'edit' && user ? user.username : undefined}
        footer={
          <>
            {mode === 'edit' && user && !isSelf && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mr-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-redText dark:text-red hover:bg-red/10"
              >
                <FiTrash2 size={15} />
                {t('administration.usersPage.delete')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {t('administration.usersPage.cancel')}
            </button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? '…' : mode === 'create' ? t('administration.usersPage.create') : t('administration.usersPage.save')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field
            label={t('administration.usersPage.username')}
            htmlFor="user-username"
            required={mode === 'create'}
            hint={mode === 'edit' ? t('administration.usersPage.usernameLocked') : undefined}
            error={errors.username}
          >
            <TextInput
              id="user-username"
              value={form.username}
              invalid={!!errors.username}
              disabled={mode === 'edit'}
              autoComplete="off"
              className="disabled:opacity-60"
              onChange={(e) => set('username', e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('administration.usersPage.name')} htmlFor="user-name" required error={errors.name}>
              <TextInput id="user-name" value={form.name} invalid={!!errors.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label={t('administration.usersPage.surname')} htmlFor="user-surname" required error={errors.surname}>
              <TextInput id="user-surname" value={form.surname} invalid={!!errors.surname} onChange={(e) => set('surname', e.target.value)} />
            </Field>
          </div>

          <Field
            label={t('administration.usersPage.password')}
            htmlFor="user-password"
            required={mode === 'create'}
            hint={mode === 'edit' ? t('administration.usersPage.passwordEditHint') : undefined}
            error={errors.password}
          >
            <TextInput
              id="user-password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              invalid={!!errors.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </Field>

          <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
            <div>
              <Switch
                checked={form.isActive}
                onChange={(v) => set('isActive', v)}
                label={t('administration.usersPage.activeToggle')}
              />
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                {t('administration.usersPage.activeToggleHint')}
              </p>
            </div>
            <div>
              <Switch
                checked={form.isSuperuser}
                disabled={isSelf}
                onChange={(v) => set('isSuperuser', v)}
                label={t('administration.usersPage.adminToggle')}
              />
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                {isSelf ? t('administration.usersPage.adminToggleSelf') : t('administration.usersPage.adminToggleHint')}
              </p>
            </div>
          </div>

          {mode === 'create' && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t('administration.usersPage.catalogsTitle')}</h3>
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{t('administration.usersPage.catalogsHint')}</p>
              <Select
                aria-label={t('administration.userProfile.catalogs.pick')}
                value=""
                placeholder={
                  freeCatalogs.length === 0
                    ? t('administration.userProfile.catalogs.allAssigned')
                    : t('administration.userProfile.catalogs.pick')
                }
                disabled={freeCatalogs.length === 0}
                onChange={(id) => {
                  const catalog = catalogs.find((c) => c.id === id);
                  if (catalog) setGrants((prev) => [...prev, { catalog, mode: 'read' }]);
                }}
                options={freeCatalogs.map((c) => ({ value: c.id, label: c.title }))}
                triggerClassName="h-10 rounded-lg border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/40"
              />
              <div className="mt-2 flex flex-col gap-1.5">
                {grants.map((g) => (
                  <div key={g.catalog.id} className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{g.catalog.title}</span>
                    <Select
                      aria-label={`${g.catalog.title} — ${t('administration.userProfile.catalogs.mode')}`}
                      value={g.mode}
                      onChange={(value) =>
                        setGrants((prev) => prev.map((x) => (x.catalog.id === g.catalog.id ? { ...x, mode: value as CatalogAccessMode } : x)))
                      }
                      options={modeOptions}
                      className="w-40 shrink-0"
                      triggerClassName="rounded-md border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1"
                    />
                    <button
                      type="button"
                      aria-label={`${t('administration.catalogsPage.remove')} ${g.catalog.title}`}
                      onClick={() => setGrants((prev) => prev.filter((x) => x.catalog.id !== g.catalog.id))}
                      className="text-zinc-400 hover:text-redText dark:hover:text-red"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Field
            label={t('administration.usersPage.passphrase')}
            htmlFor="user-passphrase"
            hint={
              mode === 'edit' && user?.has_lcp_passphrase
                ? t('administration.usersPage.passphraseSetHint')
                : t('administration.usersPage.passphraseHint')
            }
            error={errors.passphrase}
          >
            <TextInput
              id="user-passphrase"
              type="password"
              autoComplete="off"
              value={form.passphrase}
              invalid={!!errors.passphrase}
              onChange={(e) => set('passphrase', e.target.value)}
            />
          </Field>

          <Field label={t('administration.usersPage.passphraseHintLabel')} htmlFor="user-passphrase-hint">
            <TextInput
              id="user-passphrase-hint"
              value={form.passphraseHint}
              onChange={(e) => set('passphraseHint', e.target.value)}
            />
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        title={t('administration.usersPage.deleteConfirmTitle')}
        message={t('administration.usersPage.deleteConfirmBody', {
          name: user ? `${user.name} ${user.surname}`.trim() || user.username : '',
        })}
        confirmLabel={t('administration.usersPage.delete')}
        cancelLabel={t('administration.usersPage.cancel')}
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
