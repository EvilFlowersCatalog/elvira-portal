import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { ICategory, ICategoryNew } from '../../../../utils/interfaces/category';
import useEditCategory from '../../../../hooks/api/categories/useEditCategory';
import useCreateCategory from '../../../../hooks/api/categories/useCreateCategory';
import ModalWrapper from '../../../../components/modal/ModalWrapper';
import ElviraInput from '../../../../components/inputs/ElviraInput';

interface ICategoryFormParam {
  category?: ICategory | null;
  setOpen: (open: boolean) => void;
  reloadPage: boolean;
  setReloadPage: (reloadPage: boolean) => void;
}

const CategoryForm = ({
  category = null,
  setOpen,
  reloadPage,
  setReloadPage,
}: ICategoryFormParam) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<ICategoryNew>({
    term: category?.term ?? '',
    catalog_id: category?.catalog_id ?? import.meta.env.ELVIRA_CATALOG_ID,
    label: category?.label ?? '',
    scheme: category?.scheme ?? '',
  });

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const editCategory = useEditCategory();
  const createCategory = useCreateCategory();

  // set term
  const handleTermChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity('');
    setForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of feedForm
      term: e.target.value,
    }));
  };

  // set label
  const handleLabelChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity('');
    setForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of feedForm
      label: e.target.value,
    }));
  };

  // set scheme
  const handleSchemeChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity('');
    setForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of feedForm
      scheme: e.target.value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (category) {
        await editCategory(category.id, form);
        toast.success(t('notifications.category.edit.success'));
      } else {
        await createCategory(form);
        toast.success(t('notifications.category.add.success'));
      }

      setReloadPage(!reloadPage); // trigger refresh
    } catch {
      if (category) toast.error(t('notifications.category.edit.error'));
      else toast.error(t('notifications.category.add.error'));
    } finally {
      setOpen(false);
    }
  };

  return (
    <ModalWrapper
      title={
        category
          ? t('modal.categoryForm.editCategory')
          : t('modal.categoryForm.addCategory')
      }
      buttonLabel={
        category ? t('modal.categoryForm.edit') : t('modal.categoryForm.add')
      }
      close={() => setOpen(false)}
      yes={() => {
        buttonRef.current?.click();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className='w-full h-full flex flex-col gap-5 items-start justify-start'
      >
        <ElviraInput
          onChange={handleTermChange}
          placeholder={t('modal.categoryForm.term')}
          value={form.term}
          invalidMessage={t('modal.categoryForm.requiredMessages.term')}
          required
        />
        <ElviraInput
          onChange={handleLabelChange}
          placeholder={t('modal.categoryForm.label')}
          value={form.label}
        />
        <ElviraInput
          onChange={handleSchemeChange}
          placeholder={t('modal.categoryForm.scheme')}
          value={form.scheme}
        />
        <button ref={buttonRef} type='submit' className='hidden'></button>
      </form>
    </ModalWrapper>
  );
};

export default CategoryForm;
