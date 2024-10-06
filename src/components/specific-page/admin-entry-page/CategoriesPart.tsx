import { MdRemoveCircle } from 'react-icons/md';
import { IPartParams } from '../../../utils/interfaces/general/general';
import CategoryAutofill from '../../autofills/CategoryAutofill';
import { useState } from 'react';
import CategoryForm from '../../items/categories/CategoryForm';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../../hooks/contexts/useAppContext';

const CategoriesPart = ({ entry, setEntry }: IPartParams) => {
  const { t } = useTranslation();
  const { stuText, stuBg, umamiTrack } = useAppContext();

  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <div className='min-h-64 flex flex-1 flex-col bg-zinc-100 dark:bg-darkGray rounded-md p-4 pt-2 gap-2'>
        <div className='flex justify-end'>
          <button
            type='button'
            className={`${stuText} text-sm text-right hover:underline w-fit`}
            onClick={() => {
              umamiTrack('Entry Create Category Button');

              setOpen(true);
            }}
          >
            {t('entry.wizard.new')}
          </button>
        </div>
        <div className='flex flex-1 flex-col gap-2 w-full rounded-md'>
          <CategoryAutofill entryForm={entry} setEntryForm={setEntry} />
          {entry?.categories?.map((item, index) => (
            <div key={index} className={`h-fit`}>
              <button
                type='button'
                className={`${stuBg}p-2 text-sm hover:bg-red w-full flex gap-2 justify-between items-center text-white rounded-md`}
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
