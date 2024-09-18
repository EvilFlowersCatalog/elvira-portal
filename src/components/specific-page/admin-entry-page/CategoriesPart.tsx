import { MdRemoveCircle } from 'react-icons/md';
import { IPartParams } from '../../../utils/interfaces/general/general';
import CategoryAutofill from '../../autofills/CategoryAutofill';

const CategoriesPart = ({ entry, setEntry }: IPartParams) => {
  return (
    <div className='min-h-64 flex flex-1 flex-col bg-zinc-100 dark:bg-darkGray rounded-md p-4 pt-2 gap-2'>
      <div className='flex flex-1 flex-col gap-2 w-full rounded-md'>
        <CategoryAutofill entryForm={entry} setEntryForm={setEntry} />
        {entry?.categories?.map((item, index) => (
          <div key={index} className={`h-fit`}>
            <button
              type='button'
              className='bg-STUColor p-2 text-sm hover:bg-red w-full flex gap-2 justify-between items-center text-white rounded-md'
              onClick={() => {
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
  );
};

export default CategoriesPart;
