import { MdRemoveCircle } from 'react-icons/md';
import { IPartParams } from '../../../utils/interfaces/general/general';
import FeedAutofill from '../../autofills/FeedAutofill';
import { useState } from 'react';
import FeedForm from '../../items/feeds/admin/FeedForm';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../../hooks/contexts/useAppContext';
import { IoMdAdd } from 'react-icons/io';

const FeedsPart = ({ entry, setEntry }: IPartParams) => {
  const { t } = useTranslation();
  const { stuText, stuBg, umamiTrack } = useAppContext();

  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <div className='flex flex-1 flex-col bg-slate-200 dark:bg-gray rounded-md p-4 pt-2 gap-2'>
        <div className='flex justify-between w-full'>
          <h2 className='text-lg'>{t('entry.wizard.feeds')}</h2>
          <IoMdAdd onClick={() => {
            umamiTrack('Entry Create Feed Button');
            setOpen(true);
          }} className='ml-auto cursor-pointer' size={20} />
        </div>
        <div className='flex flex-1 flex-col gap-2 w-full rounded-md'>
          <FeedAutofill entryForm={entry} setEntryForm={setEntry} />
          {entry?.feeds?.map((item, index) => (
            <div key={index} className={`h-fit`}>
              <button
                type='button'
                className={`${stuBg} p-2 text-sm hover:bg-red w-full flex gap-2 justify-between items-center text-white rounded-md`}
                onClick={() => {
                  umamiTrack('Entry Remove Feed Button', {
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
