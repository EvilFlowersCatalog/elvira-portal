import { MdDelete, MdEdit } from 'react-icons/md';
import { useState } from 'react';
import CategoryForm from './CategoryForm';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { ICategory } from '../../../../utils/interfaces/category';
import useDeleteCategory from '../../../../hooks/api/categories/useDeleteCategory';
import ConfirmationDialog from '../../../../components/dialogs/ConfirmationDialog';

interface ICategoryParam {
  category: ICategory;
  reloadPage: boolean;
  setReloadPage: (reloadPage: boolean) => void;
}

const Category = ({ category, reloadPage, setReloadPage }: ICategoryParam) => {
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
      <div className='w-full flex flex-col md:w-1/2 lg:w-1/4 xl:w-1/5 xxl:w-1/6 p-2'>
        <div className='w-full h-full flex flex-col justify-center uppercase font-bold items-center select-none bg-STUColor rounded-t-md p-4'>
          <span className='text-lg uppercase font-extrabold'>
            {category.term}
          </span>
          <span className='text-sm'>{category.label}</span>
        </div>
        <div className='flex rounded-b-md'>
          <button
            className='flex flex-1 justify-center py-2 bg-green text-white rounded-bl-md hover:bg-STUColor'
            onClick={() => setIsOpen(true)}
          >
            <MdEdit size={20} />
          </button>
          <button
            className='flex flex-1 justify-center py-2 bg-red text-white rounded-br-md hover:bg-STUColor'
            onClick={() => setShowDeleteMenu(true)}
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
