import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FiTrash2 } from 'react-icons/fi';
import Drawer from '../Drawer';
import ConfirmDialog from '../ConfirmDialog';
import { Field, TextInput } from '../Field';
import Button from '../../buttons/Button';
import { ICategory } from '../../../utils/interfaces/category';
import useCreateCategory from '../../../hooks/api/categories/useCreateCategory';
import useEditCategory from '../../../hooks/api/categories/useEditCategory';
import useDeleteCategory from '../../../hooks/api/categories/useDeleteCategory';

interface CategoryDrawerProps {
  open: boolean;
  category: ICategory | null;
  mode: 'create' | 'edit';
  catalogId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CategoryDrawer({ open, category, mode, catalogId, onClose, onSaved }: CategoryDrawerProps) {
  const { t } = useTranslation();
  const createCategory = useCreateCategory();
  const editCategory = useEditCategory();
  const deleteCategory = useDeleteCategory();

  const [label, setLabel] = useState('');
  const [term, setTerm] = useState('');
  const [scheme, setScheme] = useState('');
  const [errors, setErrors] = useState<{ label?: string; term?: string }>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setLabel(mode === 'edit' && category ? category.label : '');
    setTerm(mode === 'edit' && category ? category.term : '');
    setScheme(mode === 'edit' && category ? category.scheme ?? '' : '');
  }, [open, mode, category]);

  const validate = () => {
    const e: typeof errors = {};
    if (!label.trim()) e.label = t('administration.categoriesPage.labelRequired');
    if (!term.trim()) e.term = t('administration.categoriesPage.termRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const cid = mode === 'edit' && category ? category.catalog_id : catalogId;
    if (!cid) return;
    setSaving(true);
    try {
      const payload = { label: label.trim(), term: term.trim(), scheme: scheme.trim(), catalog_id: cid };
      if (mode === 'create') {
        await createCategory(payload);
        toast.success(t('administration.categoriesPage.created'));
      } else if (category) {
        await editCategory(category.id, payload);
        toast.success(t('administration.categoriesPage.saved'));
      }
      onSaved();
      onClose();
    } catch {
      toast.error(t('administration.categoriesPage.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    setDeleting(true);
    try {
      await deleteCategory(category.id);
      toast.success(t('administration.categoriesPage.deleted'));
      setConfirmDelete(false);
      onSaved();
      onClose();
    } catch {
      toast.error(t('administration.categoriesPage.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={mode === 'create' ? t('administration.categoriesPage.createTitle') : t('administration.categoriesPage.editTitle')}
        description={mode === 'edit' && category ? category.label : undefined}
        footer={
          <>
            {mode === 'edit' && category && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mr-auto inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-redText dark:text-red hover:bg-red/10"
              >
                <FiTrash2 size={15} />
                {t('administration.categoriesPage.delete')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {t('administration.categoriesPage.cancel')}
            </button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? '…' : mode === 'create' ? t('administration.categoriesPage.create') : t('administration.categoriesPage.save')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label={t('administration.categoriesPage.label')} htmlFor="cat-label" required error={errors.label}>
            <TextInput id="cat-label" value={label} invalid={!!errors.label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Field
            label={t('administration.categoriesPage.term')}
            htmlFor="cat-term"
            required
            hint={t('administration.categoriesPage.termHint')}
            error={errors.term}
          >
            <TextInput id="cat-term" value={term} invalid={!!errors.term} onChange={(e) => setTerm(e.target.value)} />
          </Field>
          <Field label={t('administration.categoriesPage.scheme')} htmlFor="cat-scheme" hint={t('administration.categoriesPage.schemeHint')}>
            <TextInput id="cat-scheme" value={scheme} onChange={(e) => setScheme(e.target.value)} />
          </Field>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        title={t('administration.categoriesPage.deleteConfirmTitle')}
        message={t('administration.categoriesPage.deleteConfirmBody', { name: category?.label ?? '' })}
        confirmLabel={t('administration.categoriesPage.delete')}
        cancelLabel={t('administration.categoriesPage.cancel')}
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
