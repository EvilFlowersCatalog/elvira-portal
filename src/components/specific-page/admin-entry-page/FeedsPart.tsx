import { MdRemoveCircle } from 'react-icons/md';
import { IPartParams } from '../../../utils/interfaces/general/general';
import FeedAutofill from '../../autofills/FeedAutofill';
import { useState } from 'react';
import FeedForm from '../../items/feeds/admin/FeedForm';
import { useTranslation } from 'react-i18next';

const FeedsPart = ({ entry, setEntry }: IPartParams) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <div className='min-h-64 flex flex-1 flex-col bg-zinc-100 dark:bg-darkGray rounded-md p-4 pt-2 gap-2'>
        <div className='flex justify-end'>
          <button
            type='button'
            className='text-STUColor text-sm text-right hover:underline w-fit'
            onClick={() => {
              umami.track('Entry Create Feed Button');
              setOpen(true);
            }}
          >
            {t('entry.wizard.new')}
          </button>
        </div>
        <div className='flex flex-1 flex-col gap-2 w-full rounded-md'>
          <FeedAutofill entryForm={entry} setEntryForm={setEntry} />
          {entry?.feeds?.map((item, index) => (
            <div key={index} className={`h-fit`}>
              <button
                type='button'
                className='bg-STUColor p-2 text-sm hover:bg-red w-full flex gap-2 justify-between items-center text-white rounded-md'
                onClick={() => {
                  umami.track('Entry Remove Feed Button', {
                    feedId: item.id,
                  });
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
      {open && <FeedForm setOpen={setOpen} />}
    </>
  );
};

export default FeedsPart;
