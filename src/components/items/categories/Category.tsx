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
      <div className='w-full flex flex-col md:w-1/2 xl:w-1/3 p-2'>
        <div
          className={`w-full h-full flex flex-col gap-4 select-none ${stuBg} rounded-t-md p-4`}
        >
          <div className='flex text-left gap-2 items-center'>
            <span className='font-semibold uppercase'>Term:</span>
            <span>{category.term}</span>
          </div>
          <div className='flex text-left gap-2 items-center'>
            <span className='font-semibold uppercase'>Label:</span>
            <span>{category.label ? category.label : '-'}</span>
          </div>
          <div className='flex text-left gap-2 items-center'>
            <span className='font-semibold uppercase'>Schema:</span>
            <span>{category.scheme ? category.scheme : '-'}</span>
          </div>
        </div>
        <div className='flex rounded-b-md'>
          <button
            className={`flex flex-1 justify-center py-2 bg-green text-white rounded-bl-md ${stuBgHover}`}
            onClick={() => {
              umamiTrack('Edit Category Button', {
                categoryId: category.id,
              });
              setIsOpen(true);
            }}
          >
            <MdEdit size={20} />
          </button>
          <button
            className={`flex flex-1 justify-center py-2 bg-red text-white rounded-br-md ${stuBgHover}`}
            onClick={() => {
              umamiTrack('Delete Category Button', {
                categoryId: category.id,
              });
              setShowDeleteMenu(true);
            }}
          >
            <MdDelete size={20} />
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
