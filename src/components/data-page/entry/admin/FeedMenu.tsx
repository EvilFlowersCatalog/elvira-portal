import { MdRemoveCircle } from 'react-icons/md';
import PageLoading from '../../PageLoading';
import { IFeed } from '../../../../utils/interfaces/feed';
import { useTranslation } from 'react-i18next';

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

  return isLoading ? (
    <PageLoading />
  ) : feeds.length === 0 ? (
    <div>{t('modal.feedMenu.empty')}</div>
  ) : (
    <>
      <div className='flex w-full flex-wrap'>
        {activeFeeds.map((feeds, index) => (
          <div key={index} className='w-1/4 p-2'>
            <button
              onClick={() =>
                setActiveFeeds(
                  // Return only those which id does not equal
                  activeFeeds.filter(
                    (activeFeeds) => activeFeeds.id !== feeds.id
                  )
                )
              }
              className='bg-STUColor text-sm hover:bg-red w-full h-full p-2 flex justify-between items-center text-white rounded-md'
            >
              {feeds.title}
              <MdRemoveCircle size={15} />
            </button>
          </div>
        ))}
      </div>
      <div className='flex w-full flex-wrap'>
        {feeds.map((feed, index) => (
          <div key={index} className='w-1/4 p-2'>
            <button
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
              className='bg-white dark:bg-gray hover:bg-opacity-50 dark:hover:bg-opacity-50 w-full h-full py-2 flex justify-center items-center dark:text-white text-black rounded-md'
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
