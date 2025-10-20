import { MdRemoveCircle } from 'react-icons/md';
import { IPartParams } from '../../../utils/interfaces/general/general';
import CategoryAutofill from '../../autofills/CategoryAutofill';
import { useState } from 'react';
import CategoryForm from '../../items/categories/CategoryForm';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../../hooks/contexts/useAppContext';
import { IoMdAdd } from 'react-icons/io';

const CategoriesPart = ({ entry, setEntry }: IPartParams) => {
  const { t } = useTranslation();
  const { stuText, stuBg, umamiTrack } = useAppContext();

  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <div className='flex flex-1 flex-col bg-slate-200 dark:bg-gray rounded-md p-4 pt-2 gap-2'>
        <div className='flex justify-between w-full'>
          <h2 className='text-lg'>{t('entry.wizard.categories')}</h2>
          <IoMdAdd onClick={() => {
            umamiTrack('try Create Category Bu');
            setOpen(true);
          }} className='ml-auto cursor-pointer' size={20} />
        </div>
        <div className='flex flex-1 flex-col gap-2 w-full rounded-md'>
          <CategoryAutofill entryForm={entry} setEntryForm={setEntry} setIsSelectionOpen={() => { }} />
          {entry?.categories?.map((item, index) => (
            <div key={index} className={`h-fit`}>
              <button
                type='button'
                className={`${stuBg} p-2 text-sm hover:bg-red w-full flex gap-2 justify-between items-center text-white rounded-md`}
                onClick={() => {
                  umamiTrack('Entry Remove Category Button', {
                    categoryId: item.id,
                  });
                  setEntry({
                    ...entry,
                    categories: entry.categories.filter(
                      (pc) => pc.id !== item.id
                    ),
                  });
                }}
              >
                {item.term}
                <MdRemoveCircle size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
      {open && <CategoryForm setOpen={setOpen} />}
    </>
  );
};

export default CategoriesPart;
