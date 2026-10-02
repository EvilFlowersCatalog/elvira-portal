import { MdRemoveCircle } from 'react-icons/md';
import { IPartParams } from '../../../utils/interfaces/general/general';
import CategoryAutofill from '../../autofills/CategoryAutofill';
import { useState } from 'react';
import CategoryDrawer from '../../admin/categories/CategoryDrawer';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../../hooks/contexts/useAppContext';
import { IoMdAdd } from 'react-icons/io';

const CategoriesPart = ({ entry, setEntry }: IPartParams) => {
  const { t } = useTranslation();
  const { umamiTrack } = useAppContext();

  const [open, setOpen] = useState<boolean>(false);
  // Remounts the autofill so it refetches the category list after a create.
  const [autofillKey, setAutofillKey] = useState<number>(0);

  return (
    <>
      <div className='flex flex-1 flex-col gap-2'>
        <div className='flex justify-between w-full'>
          <h2 className='text-sm font-semibold text-zinc-700 dark:text-zinc-200'>{t('entry.wizard.categories')}</h2>
          <IoMdAdd onClick={() => {
            umamiTrack('try Create Category Bu');
            setOpen(true);
          }} className='ml-auto cursor-pointer' size={20} />
        </div>
        <div className='flex flex-1 flex-col gap-2 w-full rounded-md'>
          <CategoryAutofill key={autofillKey} entryForm={entry} setEntryForm={setEntry} setIsSelectionOpen={() => { }} />
          {entry?.categories?.map((item, index) => (
            <div key={index} className={`h-fit`}>
              <button
                type='button'
                className={`bg-primary p-2 text-sm hover:bg-redText w-full flex gap-2 justify-between items-center text-white rounded-md`}
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
                {item.label || item.term}
                <MdRemoveCircle size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <CategoryDrawer
        open={open}
        category={null}
        mode='create'
        catalogId={import.meta.env.ELVIRA_CATALOG_ID}
        onClose={() => setOpen(false)}
        onSaved={() => setAutofillKey((k) => k + 1)}
        onCreated={(category) => {
          if (!entry.categories?.some((c) => c.id === category.id)) {
            setEntry({ ...entry, categories: [...(entry.categories ?? []), category] });
          }
        }}
      />
    </>
  );
};

export default CategoriesPart;
