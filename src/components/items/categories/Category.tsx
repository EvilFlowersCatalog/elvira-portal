import { MdDelete, MdEdit } from 'react-icons/md';
import { useState } from 'react';
import CategoryForm from './CategoryForm';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import useDeleteCategory from '../../../hooks/api/categories/useDeleteCategory';
import { ICategory } from '../../../utils/interfaces/category';
import ConfirmationDialog from '../../dialogs/ConfirmationDialog';
import useAppContext from '../../../hooks/contexts/useAppContext';

interface ICategoryParam {
  category: ICategory;
  reloadPage: boolean;
  setReloadPage: (reloadPage: boolean) => void;
}

const Category = ({ category, reloadPage, setReloadPage }: ICategoryParam) => {
  const { stuBg, stuBgHover, umamiTrack } = useAppContext();
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState<boolean>(false);

  const deleteCategory = useDeleteCategory();

  const handleDelete = async () => {
    try {
      await deleteCategory(category.id);
      toast.success(t('notifications.category.remove.success'));

      setReloadPage(!reloadPage);
    } catch {
      toast.error(t('notifications.category.remove.error'));
    } finally {
      setShowDeleteMenu(false);
    }
  };

  return (
    <>
      <div className='flex flex-col rounded-xl overflow-hidden shadow-md bg-white dark:bg-darkGray border border-zinc-300 dark:border-zinc-700'>
        <div className={`w-full h-full flex flex-col gap-3 select-none ${stuBg} text-white p-5`}>
          <h3 className="text-lg font-bold uppercase tracking-wide mb-2">{t('administration.categoriesPage.info')}</h3>

          <div className="flex justify-between items-center border-b border-white/20 pb-2">
            <span className="text-sm font-medium text-white/80">{t('administration.categoriesPage.term')}</span>
            <span className="text-sm">{category.term}</span>
          </div>

          <div className="flex justify-between items-center border-b border-white/20 pb-2">
            <span className="text-sm font-medium text-white/80">{t('administration.categoriesPage.label')}</span>
            <span className="text-sm">{category.label || <span className="opacity-50 italic">{t('administration.categoriesPage.none')}</span>}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-white/80">{t('administration.categoriesPage.scheme')}</span>
            <span className="text-sm break-all">{category.scheme || <span className="opacity-50 italic">{t('administration.categoriesPage.none')}</span>}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='grid grid-cols-2'>
          <button
            className={`py-2 flex items-center justify-center text-sm font-medium bg-green text-white hover:brightness-110 transition-colors ${stuBgHover}`}
            onClick={() => {
              umamiTrack('Edit Category Button', {
                categoryId: category.id,
              });
              setIsOpen(true);
            }}
          >
            <MdEdit size={20} />
            {t('administration.categoriesPage.edit')}
          </button>
          <button
            className={`py-2 flex items-center justify-center text-sm font-medium bg-red text-white hover:brightness-110 transition-colors ${stuBgHover}`}
            onClick={() => {
              umamiTrack('Delete Category Button', {
                categoryId: category.id,
              });
              setShowDeleteMenu(true);
            }}
          >
            <MdDelete size={20} />
            {t('administration.categoriesPage.delete')}
          </button>
        </div>
      </div>
      {showDeleteMenu && (
        <ConfirmationDialog
          name={category.term}
          close={setShowDeleteMenu}
          yes={handleDelete}
          type='category'
        />
      )}
      {isOpen && (
        <CategoryForm
          category={category}
          setOpen={setIsOpen}
          reloadPage={reloadPage}
          setReloadPage={setReloadPage}
        />
      )}
    </>
  );
};

export default Category;
