import { MdRemoveCircle } from 'react-icons/md';
import { IPartParams } from '../../../utils/interfaces/general/general';
import FeedAutofill from '../../autofills/FeedAutofill';

const FeedsPart = ({ entry, setEntry }: IPartParams) => {
  return (
    <div className='min-h-64 flex flex-1 flex-col bg-zinc-100 dark:bg-darkGray rounded-md p-4 pt-2 gap-2'>
      <div className='flex flex-1 flex-col gap-2 w-full rounded-md'>
        <FeedAutofill entryForm={entry} setEntryForm={setEntry} />
        {entry?.feeds?.map((item, index) => (
          <div key={index} className={`h-fit`}>
            <button
              type='button'
              className='bg-STUColor p-2 text-sm hover:bg-red w-full flex gap-2 justify-between items-center text-white rounded-md'
              onClick={() => {
                setEntry({
                  ...entry,
                  feeds: entry.feeds.filter(
                    (prevFeed) => prevFeed.id !== item.id
                  ),
                });
              }}
            >
              {item.title}
              <MdRemoveCircle size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedsPart;
