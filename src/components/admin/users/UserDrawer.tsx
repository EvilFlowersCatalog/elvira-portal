import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FiTrash2 } from 'react-icons/fi';
import Drawer from '../Drawer';
import ConfirmDialog from '../ConfirmDialog';
import { Field, TextInput, Switch } from '../Field';
import Button from '../../buttons/Button';
import { IUser } from '../../../utils/interfaces/user';
import useCreateUser from '../../../hooks/api/users/useCreateUser';
import useUpdateUser from '../../../hooks/api/users/useUpdateUser';
import useDeleteUser from '../../../hooks/api/users/useDeleteUser';

interface UserDrawerProps {
  open: boolean;
  /** null => create mode. */
  user: IUser | null;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  username: string;
  name: string;
  surname: string;
  password: string;
  passphrase: string;
  passphraseHint: string;
  isActive: boolean;
}

const EMPTY: FormState = {
  username: '',
  name: '',
  surname: '',
  password: '',
  passphrase: '',
  passphraseHint: '',
  isActive: true,
};

export default function UserDrawer({ open, user, mode, onClose, onSaved }: UserDrawerProps) {
  const { t } = useTranslation();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === 'edit' && user) {
      setForm({
        username: user.username,
        name: user.name ?? '',
        surname: user.surname ?? '',
        password: '',
        passphrase: '',
        passphraseHint: user.lcp_passphrase_hint ?? '',
        isActive: user.is_active,
      });
    } else {
      setForm(EMPTY);
    }
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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (mode === 'create') {
        await createUser({
          username: form.username.trim(),
          name: form.name.trim(),
          surname: form.surname.trim(),
          password: form.password,
          is_active: form.isActive,
          ...(form.passphrase ? { lcp_passphrase: form.passphrase } : {}),
          ...(form.passphraseHint ? { lcp_passphrase_hint: form.passphraseHint } : {}),
        });
        toast.success(t('administration.usersPage.created'));
      } else if (user) {
        await updateUser(user.id, {
          name: form.name.trim(),
          surname: form.surname.trim(),
          is_active: form.isActive,
          ...(form.password ? { password: form.password } : {}),
          ...(form.passphrase ? { lcp_passphrase: form.passphrase } : {}),
          ...(form.passphraseHint ? { lcp_passphrase_hint: form.passphraseHint } : {}),
        });
        toast.success(t('administration.usersPage.saved'));
      }
      onSaved();
      onClose();
    } catch {
      toast.error(t('administration.usersPage.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteUser(user.id);
      toast.success(t('administration.usersPage.deleted'));
      setConfirmDelete(false);
      onSaved();
      onClose();
    } catch {
      toast.error(t('administration.usersPage.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={mode === 'create' ? t('administration.usersPage.createTitle') : t('administration.usersPage.editTitle')}
        description={mode === 'edit' && user ? user.username : undefined}
        footer={
          <>
            {mode === 'edit' && user && (
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
            error={errors.username}
          >
            <TextInput
              id="user-username"
              value={form.username}
              invalid={!!errors.username}
              disabled={mode === 'edit'}
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

          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
            <Switch
              checked={form.isActive}
              onChange={(v) => set('isActive', v)}
              label={t('administration.usersPage.activeToggle')}
            />
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {t('administration.usersPage.activeToggleHint')}
            </p>
          </div>

          <Field
            label={t('administration.usersPage.passphrase')}
            htmlFor="user-passphrase"
            hint={t('administration.usersPage.passphraseHint')}
          >
            <TextInput
              id="user-passphrase"
              type="password"
              autoComplete="off"
              value={form.passphrase}
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
