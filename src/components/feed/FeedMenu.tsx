import { MdRemoveCircle } from 'react-icons/md';
import { IFeed } from '../../utils/interfaces/feed';
import { useTranslation } from 'react-i18next';
import { CircleLoader } from 'react-spinners';
import useAppContext from '../../hooks/contexts/useAppContext';

interface IFeedMenuParams {
  isLoading: boolean;
  activeFeeds: { title: string; id: string }[];
  setActiveFeeds: (activeFeeds: { title: string; id: string }[]) => void;
  feeds: IFeed[];
}
const FeedMenu = ({
  isLoading,
  activeFeeds,
  setActiveFeeds,
  feeds,
}: IFeedMenuParams) => {
  const { t } = useTranslation();
  const { STUColor } = useAppContext();

  return isLoading ? (
    <div className='flex justify-center'>
      <CircleLoader color={STUColor} size={50} />
    </div>
  ) : feeds.length === 0 ? (
    <div>{t('modal.feedMenu.empty')}</div>
  ) : (
    <>
      <div className='flex w-full flex-wrap'>
        {activeFeeds.map((feeds, index) => (
          <div key={index} className='w-full sm:w-1/2 md:w-1/3 lg:w-1/4 p-2'>
            <button
              type='button'
              className='bg-STUColor text-sm hover:bg-red w-full h-full p-2 flex justify-between items-center text-white rounded-md'
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
      <div className='flex w-full flex-wrap'>
        {feeds.map((feed, index) => (
          <div key={index} className='w-full sm:w-1/2 md:w-1/3 lg:w-1/4 p-2'>
            <button
              type='button'
              className='bg-zinc-300 dark:bg-strongDarkGray hover:bg-opacity-50 dark:hover:bg-opacity-50 w-full h-full py-2 flex justify-center items-center rounded-md'
              onClick={() => {
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
