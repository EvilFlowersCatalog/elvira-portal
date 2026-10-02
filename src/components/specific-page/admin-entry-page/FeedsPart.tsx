import { MdRemoveCircle } from 'react-icons/md';
import { IPartParams } from '../../../utils/interfaces/general/general';
import FeedAutofill from '../../autofills/FeedAutofill';
import { useState } from 'react';
import FeedDrawer from '../../admin/collections/FeedDrawer';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../../hooks/contexts/useAppContext';
import { IoMdAdd } from 'react-icons/io';

const FeedsPart = ({ entry, setEntry }: IPartParams) => {
  const { t } = useTranslation();
  const { umamiTrack } = useAppContext();

  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <div className='flex flex-1 flex-col gap-2'>
        <div className='flex justify-between w-full'>
          <h2 className='text-sm font-semibold text-zinc-700 dark:text-zinc-200'>{t('administration.nav.collections')}</h2>
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
                className={`bg-primary p-2 text-sm hover:bg-redText w-full flex gap-2 justify-between items-center text-white rounded-md`}
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
      <FeedDrawer
        open={open}
        feed={null}
        mode='create'
        catalogId={import.meta.env.ELVIRA_CATALOG_ID}
        onClose={() => setOpen(false)}
        onSaved={() => {}}
        onCreated={(feed) => {
          umamiTrack('Entry Add Created Feed', { feedId: feed.id });
          if (!entry.feeds?.some((f) => f.id === feed.id)) {
            setEntry({ ...entry, feeds: [...(entry.feeds ?? []), feed] });
          }
        }}
      />
    </>
  );
};

export default FeedsPart;
