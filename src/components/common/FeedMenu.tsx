import { MdRemoveCircle } from 'react-icons/md';
import { IFeed } from '../../utils/interfaces/feed';
import { useTranslation } from 'react-i18next';
import { CircleLoader } from 'react-spinners';
import useAppContext from '../../hooks/contexts/useAppContext';
import useCustomEffect from '../../hooks/useCustomEffect';
import { useState } from 'react';
import useGetFeeds from '../../hooks/api/feeds/useGetFeeds';

interface IFeedMenuParams {
  activeFeeds: { title: string; id: string }[];
  setActiveFeeds: (activeFeeds: { title: string; id: string }[]) => void;
  searchBar?: boolean;
}
const FeedMenu = ({
  activeFeeds,
  setActiveFeeds,
  searchBar = false,
}: IFeedMenuParams) => {
  const { t } = useTranslation();
  const { STUColor } = useAppContext();
  const [feeds, setFeeds] = useState<IFeed[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getFeeds = useGetFeeds();

  useCustomEffect(() => {
    (async () => {
      try {
        const { items } = await getFeeds({
          paginate: false,
          kind: 'acquisition',
        });
        setFeeds(items);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return isLoading ? (
    <div className='flex flex-1 justify-center items-center'>
      <CircleLoader color={STUColor} size={50} />
    </div>
  ) : feeds.length === 0 ? (
    <div className='flex h-40 items-center justify-center text-center text-xl font-extrabold'>
      {t('modal.feedMenu.empty')}
    </div>
  ) : (
    <>
      <span className='font-bold pl-1 text-left w-full'>
        {t('modal.feedMenu.selected')}
      </span>

      <div className='flex w-full flex-wrap mb-2'>
        {activeFeeds.map((feeds, index) => (
          <div key={index} className={`${searchBar ? 'w-full' : ''} p-1`}>
            <button
              type='button'
              className='bg-STUColor p-2 text-sm hover:bg-red w-full h-full flex gap-2 justify-between items-center text-white rounded-md'
              onClick={() =>
                setActiveFeeds(
                  // Return only those which id does not equal
                  activeFeeds.filter(
                    (activeFeeds) => activeFeeds.id !== feeds.id
                  )
                )
              }
            >
              {feeds.title}
              <MdRemoveCircle size={15} />
            </button>
          </div>
        ))}
      </div>
      <span className='font-bold pl-1 text-left w-full'>
        {t('modal.feedMenu.options')}
      </span>
      <div className='flex w-full flex-wrap'>
        {feeds.map((feed, index) => (
          <div key={index} className={`${searchBar ? 'w-1/2' : ''} p-1`}>
            <button
              type='button'
              className='bg-black text-white dark:bg-white dark:text-black hover:bg-opacity-50 dark:hover:bg-opacity-50 w-full h-full py-2 px-4 flex justify-center items-center rounded-md'
              onClick={() => {
                if (searchBar) {
                  setActiveFeeds([feed]);
                } else {
                  // Check if a feed with the same ID already exists
                  const existingFeed = activeFeeds.find(
                    (prevFeed) => prevFeed.id === feed.id
                  );
                  // If no feed with the same ID exists, add the new feed
                  if (!existingFeed) {
                    setActiveFeeds([...activeFeeds, feed]);
                  }
                  // If a feed with the same ID exists, return the previous state unchanged
                  else setActiveFeeds(activeFeeds);
                }
              }}
            >
              {feed.title}
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default FeedMenu;
