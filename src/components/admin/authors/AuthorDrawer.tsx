import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FiTrash2 } from 'react-icons/fi';
import Drawer from '../Drawer';
import ConfirmDialog from '../ConfirmDialog';
import { Field, TextInput } from '../Field';
import Button from '../../buttons/Button';
import { IAuthor } from '../../../utils/interfaces/author';
import { useCreateAuthor, useUpdateAuthor, useDeleteAuthor } from '../../../hooks/api/authors/useAdminAuthors';

interface AuthorDrawerProps {
  open: boolean;
  author: IAuthor | null;
  mode: 'create' | 'edit';
  catalogId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function AuthorDrawer({ open, author, mode, catalogId, onClose, onSaved }: AuthorDrawerProps) {
  const { t } = useTranslation();
  const createAuthor = useCreateAuthor();
  const updateAuthor = useUpdateAuthor();
  const deleteAuthor = useDeleteAuthor();

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [errors, setErrors] = useState<{ name?: string; surname?: string }>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setName(mode === 'edit' && author ? author.name : '');
    setSurname(mode === 'edit' && author ? author.surname : '');
  }, [open, mode, author]);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = t('administration.authorsPage.nameRequired');
    if (!surname.trim()) e.surname = t('administration.authorsPage.surnameRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (mode === 'create' && !catalogId) return;
    setSaving(true);
    try {
      if (mode === 'create') {
        await createAuthor({ name: name.trim(), surname: surname.trim(), catalog_id: catalogId! });
        toast.success(t('administration.authorsPage.created'));
      } else if (author) {
        await updateAuthor(author.id, { name: name.trim(), surname: surname.trim(), catalog_id: author.catalog_id });
        toast.success(t('administration.authorsPage.saved'));
      }
      onSaved();
      onClose();
    } catch {
      toast.error(t('administration.authorsPage.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!author) return;
    setDeleting(true);
    try {
      await deleteAuthor(author.id);
      toast.success(t('administration.authorsPage.deleted'));
      setConfirmDelete(false);
      onSaved();
      onClose();
    } catch {
      toast.error(t('administration.authorsPage.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={mode === 'create' ? t('administration.authorsPage.createTitle') : t('administration.authorsPage.editTitle')}
        description={mode === 'edit' && author ? `${author.name} ${author.surname}`.trim() : undefined}
        footer={
          <>
            {mode === 'edit' && author && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mr-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-redText dark:text-red hover:bg-red/10"
              >
                <FiTrash2 size={15} />
                {t('administration.authorsPage.delete')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {t('administration.authorsPage.cancel')}
            </button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? '…' : mode === 'create' ? t('administration.authorsPage.create') : t('administration.authorsPage.save')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label={t('administration.authorsPage.name')} htmlFor="author-name" required error={errors.name}>
            <TextInput id="author-name" value={name} invalid={!!errors.name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={t('administration.authorsPage.surname')} htmlFor="author-surname" required error={errors.surname}>
            <TextInput id="author-surname" value={surname} invalid={!!errors.surname} onChange={(e) => setSurname(e.target.value)} />
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        title={t('administration.authorsPage.deleteConfirmTitle')}
        message={t('administration.authorsPage.deleteConfirmBody', {
          name: author ? `${author.name} ${author.surname}`.trim() : '',
        })}
        confirmLabel={t('administration.authorsPage.delete')}
        cancelLabel={t('administration.authorsPage.cancel')}
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
